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
      opcode: 0,
      operand: 0,
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
      display_warning: true,
      running: false,
      current_state: 0,
      STATES: [
        // Fetch
        {id: 0, description: "Copy the PC value to the MAR", action: this.PCtoMAR, next: 1},
        {id: 1, description: "Send MAR value sent to RAM", action: this.MARtoRAM, next: 2},
        {id: 2, description: "Send RAM data to MDR", action: this.RAMtoMDR, next: 3},
        {id: 3, description: "Send MDR data to CIR", action: this.MDRtoCIR, next: 4},
        {id: 4, description: "Increment the PC", action: this.incrementPC, next: 5},

        // decode
        {id: 5, description: "Send instruction from CIR to CU", action: this.CIRtoCU, next: 6},
        {id: 6, description: "Instruction decoded by the CU", action: this.decodeInstruction, next: 0},
      ],
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
    editor.addLineClass(this.linenumber, "wrap", "mark");
  },

  methods: {
    PCtoMAR: function () {
      //animation

      //action
      this.mar = this.pc;
    },
    MARtoRAM: function () {
      //animation

      //action
    },
    RAMtoMDR: function () {
      //animation

      //action
      this.mdr = this.ramarray[this.mar];
    },
    MDRtoCIR: function () {
      //animation

      //action
      this.cir = this.mdr;
    },
    incrementPC: function () {
      //animation

      //action
      this.pc = this.pc + 1;
    },

    CIRtoCU: function () {

    },

    decodeInstruction: function () {
      this.opcode = Math.floor(  this.cir / 100 );
      this.operand = this.cir % 100 ;
    },


    formatInt: function (num, places) {
      if (num < 0) {
        return '-' + String(Math.abs(num)).padStart(places, '0')
      } else {
        return String(num).padStart(places, '0')
      }
    },

    doStep: function () {
      // find the action for this state
      for (var i = 0; i < this.STATES.length; i++) {
        let state = this.STATES[i];
        if (state.id === this.current_state) {
          this.current_state = state.next;
          console.log( state.description);
          state.action();
          break;
        }
      }
    },

    doCycle: function () {

    },

    run: function () {
      if (!this.running) {
        // initialise everything
        this.mar = this.mdr = this.cir = this.acc = this.pc = 0;
        this.current_state = 1;
        this.running = true;

        // assemble the program into ram
        if (this.assembleCodeToRam()) {
          this.doStep();
        }
      }
    },

    stop: function () {
      this.running = false;
      this.mar = this.mdr = this.cir = this.acc = this.pc = 0;
      this.current_state = 100;
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
                this.error = "Invalid mnemonic on line " + i;
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
                    this.error = "Invalid address on line " + i;
                    return false;
                  }
                } else {
                  this.error = "Missing address/label on line " + i;
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
                    this.error = "Invalid value on line " + i;
                    return false;
                  }
                }
                break;
              default:
                this.error = "Invalid mnemonic on line " + i;
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
