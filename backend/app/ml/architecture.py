import torch
import torch.nn as nn
import torch.nn.functional as F

NUM_CLASSES = 3

def block(in_ch, out_ch):
    return nn.Sequential(
        nn.Conv2d(in_ch,  out_ch, 3, padding=1, bias=False),
        nn.BatchNorm2d(out_ch), nn.ReLU(True),
        nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False),
        nn.BatchNorm2d(out_ch), nn.ReLU(True),
    )

class UNet(nn.Module):
    def __init__(self, n_classes=NUM_CLASSES, base=32):
        super().__init__()
        c = [base, base*2, base*4, base*8, base*16]
        self.enc  = nn.ModuleList([
            block(3, c[0]), block(c[0], c[1]),
            block(c[1], c[2]), block(c[2], c[3])
        ])
        self.bott = block(c[3], c[4])
        self.up   = nn.ModuleList([
            nn.ConvTranspose2d(c[4],c[3],2,2),
            nn.ConvTranspose2d(c[3],c[2],2,2),
            nn.ConvTranspose2d(c[2],c[1],2,2),
            nn.ConvTranspose2d(c[1],c[0],2,2),
        ])
        self.dec  = nn.ModuleList([
            block(c[3]*2,c[3]), block(c[2]*2,c[2]),
            block(c[1]*2,c[1]), block(c[0]*2,c[0])
        ])
        self.head = nn.Conv2d(c[0], n_classes, 1)

    def forward(self, x):
        skips = []
        for e in self.enc:
            x = e(x); skips.append(x); x = F.max_pool2d(x, 2)
        x = self.bott(x)
        for up, dec, s in zip(self.up, self.dec, reversed(skips)):
            x = dec(torch.cat([s, up(x)], 1))
        return self.head(x)
