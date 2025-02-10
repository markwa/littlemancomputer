// App
const {createApp, ref} = Vue

var editor = null;

document.addEventListener("DOMContentLoaded", function () {

});

createApp({
  setup() {
  },
  data: function () {
    return {
      ramarray: new Array(100).fill(0),
      pc: 0,
      mar: 0,
      cir: 0,
      mdr: 0,
      acc: 0,
      code: "      INP\n" +
        "      STA 99\n" +
        "      INP\n" +
        "      ADD 99\n" +
        "      OUT\n" +
        "      HLT\n" +
        " data DAT",
      input: "13",
      output: "15",
      codeselect: "add",
      error: "",
      linenumber: -1,
    }
  },
  mounted: function () {
    editor = CodeMirror.fromTextArea(document.getElementById('code'), {
      lineNumbers: true,
      firstLineNumber: 0,
      //mode: 'text/x-perl',
    });
    editor.setSize(380, 510);
    editor.setValue(this.code);
    editor.addLineClass( this.linenumber, "wrap", "mark");
  },
  methods: {
    formatInt: function (num, places) {
      if (num < 0) {
        return '-' + String(Math.abs(num)).padStart(places, '0')
      } else {
        return String(num).padStart(places, '0')
      }
    },

    assembleCodeToRam: function () {
      this.code = editor.getValue();
      this.error = "";
      // define the opcodes
      const mnenomics = ["hlt", "add", "sub", "sta", "!!!", "lda", "bra", "brz", "brp", "inp", "out", "otc", "dat"];

      let labels = {};
      const lines = this.code.split('\n');

      // first pass looking for labels
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        const parts = line.split(' ');
        var opcode = -1;
        for (var j = 0; j < parts.length; j++) {
          var part = parts[j].trim();
          part = part.toLowerCase();
          if (part !== '' && opcode < 0) {
            let index = mnenomics.indexOf(part);
            if (index >= 0) {
              opcode = index;
            } else {
              labels[part] = i;
            }
          }
        }
      }

      // second pass assemble into memarray
      var memarray = new Array();
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        const parts = line.split(' ');
        var opcode = -1;
        var operand = 0;
        for (var j = 0; j < parts.length; j++) {
          var part = parts[j].trim();
          part = part.toLowerCase();

          let index = mnenomics.indexOf(part);
          if (index >= 0) {
            opcode = index;

            // is there data and is it a label
            let data = null;
            if (j < (parts.length - 1)) {
              data = parts[j + 1].trim();
              data = data.toLowerCase();
            }

            // what should the operand be
            switch (opcode) {
              case 0: // hlt - no operand
              case 6: // bra - no operand
                break;
              case 4:
                this.error = "Invalid mnemonic on line " + i ;
                return false;
              case 1: // add
              case 2: // sub
              case 3: // sta
              case 5: // lda
              case 7: // brz
              case 8: // brp
                // operand is label or direct address
                if (data) {
                  if (labels[data] !== undefined) operand = labels[data];
                  else operand = parseInt(data);
                  if (isNaN(operand)) {
                    this.error = "Invalid address on line " + i ;
                    return false;
                  }
                } else {
                  this.error = "Missing address/label on line " + i ;
                  return false;
                }
                break;
              case 9: //inp
                operand = 1;
                break;
              case 10: //out
                opcode = 9;
                operand = 2;
                break;
              case 11:
                opcode = 9;
                operand = 22;
                break;
              case 12: //dat
                opcode = 0;
                if (data) {
                  operand = parseInt(data);
                  if (isNaN(operand)) {
                    this.error = "Invalid value on line " + i ;
                    return false;
                  }
                }
                break;
              default:
                this.error = "Invalid mnemonic on line " + i ;
                return false;
            }

            // combine opcode and operand
            let instruction = (opcode * 100) + operand;

            // add instruction to the memarray
            memarray.push(instruction);
          }
        }
      }

      // clear contains of ram
      for (var i = 0; i < 100; i++) {
        this.ramarray[i] = 0;
      }

      // copy the data to the ram
      for (var i = 0; i < memarray.length && i < 100; i++) {
        this.ramarray[i] = memarray[i];
      }
       return true;
    },
  }
}).mount('#app')
