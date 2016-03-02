const fs = require('fs');

function reverseBuffer(buffer) {
  var l = buffer.length;
  var output = [];

  for (var i = 0; i < l; i++) {
    var char = buffer.toString('hex', i, i + 1);
    output.push(char);
  };

  var reverseBuff = new Buffer(output.reverse().join("").toString(), 'hex');
  return reverseBuff;
}

function roundUp(x, y) {
  var m = x % y;
  if (m == 0) {
    return x;
  } else {
    return x - m + y;
  };
};

function sizeToMB(section) {
  var sectionMB = new Buffer(4);
  var intSectionMB = roundUp(section.readUInt32LE() * 0x200, 1024 * 1024) / (1024 * 1024);
  if (intSectionMB == 0) { intSectionMB = 1 };
  sectionMB.writeUInt32LE(intSectionMB);
  return sectionMB;
};

function getNcchAesCounter(ncch) {
  var counter = new Buffer(16).fill(0x00);
  if (ncch.formatVersion.readUIntLE() == 2 || ncch.formatVersion.readUIntLE() == 0) {
    counter.write(ncch.titleId.toString('hex'), 0, 8, 'hex');
    counter.writeUInt16LE(0x1, 8);
  } else if (ncch.formatVersion.readUIntLE() == 1) {
    var x = 0x200;
    counter.write(ncch.titleId.toString('hex'), 0, 8, 'hex');
    for (var i = 0; i < 4; i++) {
      counter.writeInt16LE((x >> ((3 - i) * 8)), 12 + i);
    };
  };
  return counter;
};

function genOutName(ncch) {
  var outName = new Buffer(112).fill(0x00);
  var outName_str = '/' + ncch.titleId.toString('hex').toUpperCase() + '.Main.exheader.xorpad';
  if (outName_str.length > 112) {
    console.log('Output file name too large..');
    process.exit(1);
  }
  outName.write(outName_str, 0, 112, 'utf8');
  return outName;
};

function parseNcch(f, cb) {
  var stream = fs.createReadStream(f, { start: 0x4000, end: 0x4200 });
  
  stream.on('error', cb);
  stream.on('readable', onReadable);

  function onReadable() {
    var buffer;
    while (null !== (buffer = stream.read())) {      
      if (buffer.length = 0x200) {
        const oNcch = {
          signature: buffer.slice(0x00, 0x100),
          magic: buffer.slice(0x100, 0x104),
          ncchSize: buffer.slice(0x104, 0x108),
          titleId: reverseBuffer(buffer.slice(0x108, 0x110)),
          makerCode: buffer.slice(0x110, 0x112),
          formatVersion: buffer.slice(0x112, 0x114),
          formatVersion2: buffer.slice(0x114, 0x118),
          programId: reverseBuffer(buffer.slice(0x118, 0x120)),
          logoHash: buffer.slice(0x130, 0x150),
          productCode: buffer.slice(0x150, 0x160),
          exhdrHash: buffer.slice(0x160, 0x180),
          exhdrOffset: new Buffer('00000200', 'hex'),
          exhdrSize: buffer.slice(0x180, 0x184),
          flags: reverseBuffer(buffer.slice(0x188, 0x190)),
          plainRegionOffset: buffer.slice(0x190, 0x194),
          plainRegionSize: buffer.slice(0x194, 0x198),
          logoOffset: buffer.slice(0x198, 0x19C),
          logoSize: buffer.slice(0x19c, 0x1A0),
          exefsOffset: buffer.slice(0x1A0, 0x1A4),
          exefsSize: buffer.slice(0x1A4, 0x1A8),
          exefsHashSize: buffer.slice(0x1A8, 0x1AC),
          romfsOffset: buffer.slice(0x1B0, 0x1B4),
          romfsSize: buffer.slice(0x1B4, 0x1B8),
          romfsHashSize: buffer.slice(0x1B8, 0x1BC),
          exefsHash: buffer.slice(0x1C0, 0x1E0),
          romfsHash: buffer.slice(0x1E0, 0x200)
        };
        stream.removeListener('error', cb);
        stream.removeListener('readable', onReadable);
        cb(null, oNcch);
      }
    }
  }
}

function genNcchInfo(ncch) {
  const ncchHeader = new Buffer('FFFFFFFF030000F00100000000000000', 'hex');
  var CounterExhdr = getNcchAesCounter(ncch);
  var KeyY = ncch.signature.slice(0, 16);
  var Reserved = new Buffer(4).fill(0x00);
  var Crypto7 = new Buffer(4).fill(0x00);
  var SeedCrypto = new Buffer(4).fill(0x00);
  var ExhdrSize = sizeToMB(ncch.exhdrSize);
  var ExhdrName = genOutName(ncch);

  const ncchBinLength = ncchHeader.length + CounterExhdr.length + Reserved.length + KeyY.length
    + Crypto7.length + SeedCrypto.length + ExhdrSize.length + ExhdrName.length;

  var ncchBin = Buffer.concat([ncchHeader, CounterExhdr, KeyY, ExhdrSize, Reserved, SeedCrypto,
    Crypto7, ExhdrName], ncchBinLength);

  return ncchBin;
}

var Ncch = function () { };

Ncch.prototype.parseMain = function (file, cb) {
  parseNcch(file, (err, res) => {
    if (err) throw cb(err);
    cb(null, res);
  });
};

Ncch.prototype.genFile = function (file, cb) {
  parseNcch(file, (err, res) => {
    if (err) throw cb(err);
    fs.writeFile('ncchinfo.bin', genNcchInfo(res), (err) => {
      if (err) throw cb(err);
      return cb(null);
    });
  });
};

module.exports = new Ncch();