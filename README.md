# ncch.js
[POC] Parse NCCH from a 3DS rom and generate a ncchinfo.bin in Node.JS

This is a proof of concept for creating a ncchinfo.bin without a Python dependency, but a Node.JS one.
This tool uses a library (lib/ncch.js) I will use in a CIA Converter Tool in Node.JS :)


    Usage: ncch [options] <file>

    Parses NCCH from a 3DS rom and generates a Ncchinfo.bin in Node.JS

    Options:

    -h, --help      output usage information
    -V, --version   output the version number
    -i, --info      shows NCCH as a list of buffers
    -g, --generate  generates a ncchinfo.bin
