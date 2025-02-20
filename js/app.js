// App
const {createApp, ref} = Vue

const add = "      INP\n" +
  "      STA number\n" +
  "      INP\n" +
  "      ADD number\n" +
  "      OUT\n" +
  "      HLT\n" +
  " data number";

const countdown = "      INP\n" +
  "      STA number\n" +
  "      INP\n" +
  "      ADD number\n" +
  "      OUT\n" +
  "      HLT\n" +
  " data number";

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
      result: 0,
      code: add,
      input: "",
      inputval: 0,
      waitingforinput: false,
      output: "",
      codeselect: "add",
      error: "",
      linenumber: -1,
      display_warning: true,
      running: false,
      autorun: false,
      cyclerun: false,
      speed: 50,
      next_state: 0,
      phase: "",
      fullscreen: this.isfullscreen(),
      STATES: [
        // Fetch
        {id: 0, phase: "fetch", description: "Copy the PC value to the MAR", action: this.PCtoMAR, next: 1},
        {id: 1, phase: "fetch", description: "Send MAR value sent to RAM", action: this.MARtoRAM, next: 2},
        {id: 2, phase: "fetch", description: "Send RAM data to MDR", action: this.RAMtoMDR, next: 3},
        {id: 3, phase: "fetch", description: "Send MDR data to CIR", action: this.MDRtoCIR, next: 4},
        {id: 4, phase: "fetch", description: "Increment the PC", action: this.incrementPC, next: 5},

        // decode
        {id: 5, phase: "decode", description: "Send instruction from CIR to CU", action: this.CIRtoCU, next: 6},
        {id: 6, phase: "decode", description: "Instruction decoded by the CU", action: this.decodeInstruction, next: 0},

        // add
        {id: 100, phase: "execute", description: "Operand copied to MAR", action: this.operandtoMAR, next: 101},
        {id: 101, phase: "execute", description: "Send MAR value sent to RAM", action: this.MARtoRAM, next: 102},
        {id: 102, phase: "execute", description: "Send RAM data to MDR", action: this.RAMtoMDR, next: 103},
        {
          id: 103,
          phase: "execute",
          description: "ACC and MDR data sent to ALU",
          action: this.MDRandACCtoALU,
          next: 104
        },
        {id: 104, phase: "execute", description: "ALU performs addition", action: this.ALUaddition, next: 105},
        {id: 105, phase: "execute", description: "ALU result send to ACC", action: this.ALUtoACC, next: 0},

        // sub
        {id: 200, phase: "execute", description: "Operand copied to MAR", action: this.operandtoMAR, next: 201},
        {id: 201, phase: "execute", description: "Send MAR value sent to RAM", action: this.MARtoRAM, next: 202},
        {id: 202, phase: "execute", description: "Send RAM data to MDR", action: this.RAMtoMDR, next: 203},
        {
          id: 203,
          phase: "execute",
          description: "ACC and MDR data sent to ALU",
          action: this.MDRandACCtoALU,
          next: 204
        },
        {id: 204, phase: "execute", description: "ALU performs subtraction", action: this.ALUsubtraction, next: 205},
        {id: 205, phase: "execute", description: "ALU result sent to ACC", action: this.ALUtoACC, next: 0},

        // sta
        {id: 300, phase: "execute", description: "Operand copied to MAR", action: this.operandtoMAR, next: 301},
        {id: 301, phase: "execute", description: "ACC value copied to MDR", action: this.ACCtoMDR, next: 302},
        {
          id: 302,
          phase: "execute",
          description: "MDR and MAR values sent to RAM",
          action: this.MDRandMARtoRAM,
          next: 0
        },

        // lda
        {id: 500, phase: "execute", description: "Operand copied to MAR", action: this.operandtoMAR, next: 501},
        {id: 501, phase: "execute", description: "Send MAR value sent to RAM", action: this.MARtoRAM, next: 502},
        {id: 502, phase: "execute", description: "Send RAM data to MDR", action: this.RAMtoMDR, next: 503},
        {id: 503, phase: "execute", description: "MDR data copied to ACC", action: this.MDRtoACC, next: 0},

        // bra
        {id: 600, phase: "execute", description: "Operand copied to PC", action: this.operandtoPC, next: 0},

        // brz
        {id: 700, phase: "execute", description: "ACC value sent to ALU", action: this.ACCtoALU, next: 701},
        {id: 701, phase: "execute", description: "ACC comparison with zero", action: this.ALUiszero, next: 702},
        {id: 702, phase: "execute", description: "ALU result sent to CU", action: this.ALUtoCU, next: 703},
        {id: 703, phase: "execute", description: "Operand copied to PC", action: this.operandtoPC, next: 0},

        // brp
        {id: 800, phase: "execute", description: "ACC value sent to ALU", action: this.ACCtoALU, next: 801},
        {id: 801, phase: "execute", description: "ACC greater/equal to zero", action: this.ALUispositive, next: 802},
        {id: 802, phase: "execute", description: "ALU result sent to CU", action: this.ALUtoCU, next: 803},
        {id: 803, phase: "execute", description: "Operand copied to PC", action: this.operandtoPC, next: 0},

        // inp/out/otc
        {id: 900, phase: "execute", description: "Wait for user input", action: this.waitForInput, next: 901},
        {id: 901, phase: "execute", description: "Get input and send to ACC", action: this.INPUTtoACC, next: 0},
        {id: 902, phase: "execute", description: "Output ACC value as number", action: this.ACCtoOUTPUT, next: 0},
        {id: 922, phase: "execute", description: "Output ACC value as ascii", action: this.ACCtoASCII, next: 0},

      ],
    }
  },
  mounted: function () {
    // catch window size events
    window.addEventListener('resize', this.scaleMainframe);
    this.scaleMainframe();
  },

  unmounted() {
    window.removeEventListener('resize', this.scaleMainframe);
  },

  methods: {
    scaleMainframe: function () {
      let widthscale = window.innerWidth / 1280;
      let heightscale = window.innerHeight / 770;
      let scale = Math.min(widthscale, heightscale);

      document.getElementById("mainframe").setAttribute("style", "transform: scale(" + scale + ") translate(-50%, -50%);");
    },

    addLineHighlight: function (line) {
      let id = "line-" + line;
      let element = document.getElementById(id);
      if (element) element.classList.add("mark");
    },

    removeLineHighlight: function (line) {
      let id = "line-" + line;
      let element = document.getElementById(id);
      if (element) element.classList.remove("mark");
    },

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
      this.removeLineHighlight(this.linenumber);
      this.linenumber = this.mar;
      this.addLineHighlight(this.linenumber);

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

    operandtoMAR: function () {
      this.mar = this.operand;
    },

    MDRandACCtoALU: function () {

    },

    ALUaddition: function () {
      this.result = this.acc + this.mdr;
    },

    ALUsubtraction: function () {
      this.result = this.acc - this.mdr;
    },

    ALUiszero: function () {
      if (this.acc === 0) this.result = 1;
      else this.result = 0;
    },

    ALUispositive: function () {
      if (this.acc >= 0) this.result = 1;
      else this.result = 0;
    },

    ALUtoACC: function () {
      this.acc = this.result;
    },

    ACCtoMDR: function () {
      this.mdr = this.acc;
    },

    MDRandMARtoRAM: function () {
      this.ramarray[this.mar] = this.mdr;
    },

    MDRtoACC: function () {
      this.acc = this.mdr;
    },

    operandtoPC: function () {
      if (this.opcode === 6 || this.result === 1) {
        this.pc = this.operand;
      }
    },

    ACCtoALU: function () {

    },

    ALUtoCU: function () {

    },

    waitForInput: function () {
      this.waitingforinput = true;
      var textarea = document.getElementById("input");
      this.$nextTick(() => this.$refs.lmcinput.focus())
    },

    INPUTtoACC: function () {
      let value = parseInt(this.input);
      if (isNaN(value)) {
        this.acc = 0;
      } else {
        this.acc = value;
      }
      this.input = "";
    },

    scrollOutput: function () {
      this.$nextTick(() => {
          var textarea = this.$refs.lmcoutput;
          textarea.scrollTop = textarea.scrollHeight;
        }
      );
    },

    ACCtoOUTPUT: function () {
      this.output += (this.acc.toString() + '\n');
      this.scrollOutput();
    },

    ACCtoASCII: function () {
      if (this.acc === 10 || ( this.acc >= 32 && this.acc <= 128) ){
        var chr = String.fromCharCode(this.acc);
        this.output += chr;
      } else {
        this.output += '_';
      }
      this.scrollOutput();
    },

    decodeInstruction: function () {
      this.opcode = Math.floor(this.cir / 100);
      this.operand = this.cir % 100;

      // set the next state
      if (this.opcode === 0) {
        this.phase = "";
        this.stop();
      } else if (this.opcode === 9 && this.operand > 1) {
        this.next_state = (this.opcode * 100) + this.operand;
      } else {
        this.next_state = this.opcode * 100;
      }
    },


    formatInt: function (num, places) {
      if (num < 0) {
        return '-' + String(Math.abs(num)).padStart(places, '0')
      } else {
        return String(num).padStart(places, '0')
      }
    },

    inputEnter: function () {
      // get the last line of input
      const lines = this.input.split('\n');
      const lastline = lines[lines.length - 1];
      this.inputval = parseInt(lastline);
      if (isNaN(this.inputval)) {
        this.inputval = 0;
      }
      console.log(this.inputval);
      this.waitingforinput = false;
      if (this.autorun) {
        setTimeout(function () {
          this.doStep()
        }.bind(this), (1000 - (this.speed * 10)))
      }
    },

    doStep: function () {
      if (this.running) {
        if (!this.waitingforinput) {
          // find the action for this state
          let found = false;
          for (var i = 0; i < this.STATES.length; i++) {
            let state = this.STATES[i];
            if (state.id === this.next_state) {
              found = true;
              this.next_state = state.next;
              console.log(state.description);
              this.phase = state.phase;
              state.action();
              break;
            }
          }
          if (!found) {
            console.log("State machine error!")
            this.next_state = 0;
          }

          if (this.autorun) {
            // if cycle run and the next step is the start of the fetch cycle
            // then turn off autorun until the user presses the button
            if (this.cyclerun && this.next_state === 1) {
              this.autorun = false;
            }
            setTimeout(function () {
              this.doStep()
            }.bind(this), (1000 - (this.speed * 10)))
          }
        }
      } else {
        this.autorun = false;
        this.start();
      }
    },

    doCycle: function () {
      if (!this.running) {
        this.cyclerun = true;
        this.autorun = true;
        this.start();
      } else {
        this.autorun = true;
        this.doStep();
      }
    },

    start: function () {
      if (!this.running) {
        // initialise everything
        this.reset();
        this.running = true;

        // assemble the program into ram
        if (this.assembleCodeToRam()) {
          this.doStep();
        } else {
          this.reset();
          this.running = false;
        }
      }
    },

    startauto: function () {
      if (this.running) {
        this.autorun = true;
        this.cyclerun = false;
        this.doStep();
      } else {
        this.cyclerun = false;
        this.autorun = true;
        this.start();
      }
    },

    reset: function () {
      this.mar = this.mdr = this.cir = this.acc = this.pc = 0;
      this.opcode = this.operand = 0;
      this.next_state = 1;
      this.phase = "";
      this.input = "";
      this.output = "";
      this.waitingforinput = false;
      this.removeLineHighlight(this.linenumber);
      this.linenumber = -1;

      // clear contains of ram
      for (var i = 0; i < 100; i++) {
        this.ramarray[i] = 0;
      }
    },

    stop: function () {
      if (this.running) {
        // stop
        this.running = false;
        this.autorun = false;
      } else {
        //reset
        this.reset();
      }
    },

    async saveToFile() {
      const opts = {
        types: [
          {
            description: "Assembly Language File (*.asm)",
            accept: {"text/plain": [".asm"]},
          },
        ],
      };
      const fileHandle = await window.showSaveFilePicker(opts);
      const fileStream = await fileHandle.createWritable();
      await fileStream.write(new Blob([this.code], {type: "text/plain"}));
      await fileStream.close();
    },

    async loadFromFile() {
      const opts = {
        types: [
          {
            description: "Assembly Language File (*.asm)",
            accept: {"text/plain": [".asm"]},
          },
        ],
      };
      const [fileHandle] = await window.showOpenFilePicker(opts);
      const fileStream = await fileHandle.getFile();
      const text = await fileStream.text();
      if (text !== "") {
        this.code = text
        this.$nextTick(() => {
            let event = new Event('input', {bubbles: true,});
            let element = document.getElementById('asmeditor__textarea');
            element.dispatchEvent(event);
          }
        );
      }
    },

    assembleCodeToRam: function () {
      this.error = "";
      // define the opcodes
      const mnenomics = ["hlt", "add", "sub", "sta", "!!!", "lda", "bra", "brz", "brp", "inp", "out", "otc", "dat"];

      let labels = {};
      const lines = this.code.split('\n');

      // first pass looking for labels
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        const parts = line.split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
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
        const parts = line.split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
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
                break;
              case 4:
                this.error = "Invalid mnemonic on line " + i;
                return false;
              case 1: // add
              case 2: // sub
              case 3: // sta
              case 5: // lda
              case 6: // bra
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

    toggleFullScreen: function () {
      if ((document.fullScreenElement && document.fullScreenElement !== null) ||
        (!document.mozFullScreen && !document.webkitIsFullScreen)) {
        if (document.documentElement.requestFullScreen) {
          document.documentElement.requestFullScreen();
        } else if (document.documentElement.mozRequestFullScreen) {
          document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullScreen) {
          document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        this.fullscreen = true;
      } else {
        if (document.cancelFullScreen) {
          document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        }
        this.fullscreen = false;
      }
    },

    isfullscreen: function () {
      return (document.fullScreenElement && document.fullScreenElement !== null);
    },


  }
}).mount('#app')
