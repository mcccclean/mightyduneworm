import json
import os

CENTERS = """rumble shadow stone jewel log head body""".split()

def commas(s):
    return tuple([int(x.strip()) for x in s.split(',')])

class Sprite:

    def __init__(self, name):
        self.name = name
        self.basename = name.split("_")[0]
        self.valid = False
        self.data = [0, 0, 0, 0, 0, 50, 50]
        self.idx = None

    def addline(self, l):
        self.valid = True
        key, val = [x.strip() for x in l.split(':')]
        if ',' in val:
            val = commas(val)
        if key == 'xy':
            self.data[0], self.data[1] = val
        elif key == 'size':
            self.data[2], self.data[3] = val
            self.data[5] = self.data[2] / 2
            if self.basename in CENTERS:
                self.data[6] = self.data[3] / 2
            else:
                self.data[6] = self.data[3]

def main(infile, outfile):
    sprites = []
    with open(infile) as f:
        cursprite = None
        for l in f.readlines():
            if l[0] == ' ':
                cursprite.addline(l.strip())
            else:
                cursprite = Sprite(l.strip())
                sprites.append(cursprite)

    frames = []
    animations = {}
    for i, s in enumerate(sorted([x for x in sprites if x.valid], key=lambda s: s.name)):
        s.idx = i
        frames.append(s.data)
        name = s.name.split("_")[0]
        if name not in animations:
            animations[name] = { 'frames': [s.idx] }
        else:
            animations[name]['frames'].append(s.idx)

    finaldata = dict(images=['sprites.png'], frames=frames, animations=animations)
    with open(outfile, "w") as f:
        f.write("SPRITES = ")
        json.dump(finaldata, f, indent=4)
        f.write(";")

if __name__ == "__main__":
    main("sprites.atlas", "../game/sprites.js")
    if os.path.exists("../game/sprites.png"):
        os.unlink("../game/sprites.png")
    os.rename("sprites.png", "../game/sprites.png")
    os.unlink("sprites.atlas")
