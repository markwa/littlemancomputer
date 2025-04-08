// App
const {createApp, ref} = Vue

const add = "\tINP\n" +
  "\tSTA number\n" +
  "\tINP\n" +
  "\tADD number\n" +
  "\tOUT\n" +
  "\tHLT\n" +
  "number\tDAT";

const countdown = "\tINP\n" +
  "loop\tOUT\n" +
  "\tSUB one\n" +
  "\tBRP loop\n" +
  "\tHLT\n" +
  "one\tDAT 1";

const greatest = "\tinp\n" +
  "\tsta num1\n" +
  "\tinp\n" +
  "\tsta num2\n" +
  "\tsub num1\n" +
  "\tbrp jump\n" +
  "\tlda num1\n" +
  "\tout\n" +
  "\thlt\n" +
  "jump\tlda num2\n" +
  "\tout\n" +
  "\thlt\n" +
  "num1 \tdat \n" +
  "num2\tdat  ";

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
      display_warning: false,
      running: false,
      autorun: false,
      cyclerun: false,
      speed: 70,
      next_state: 0,
      phase: "",
      narrative: "",

      fullscreen: this.isfullscreen(),
      scale: 1,

      //animations
      animations: true,
      addressValue: 0,
      dataValue: 0,
      controlSignal: "",

      //Finite State Machine
      STATES: [
        // Fetch
        {id: 0, phase: "fetch", description: "Copy PC value to the MAR", action: this.PCtoMAR, next: 1},
        {id: 1, phase: "fetch", description: "Send MAR value to RAM", action: this.MARtoRAM, next: 2},
        {id: 2, phase: "fetch", description: "Send Read Signal to RAM", action: this.ReadSignaltoRAM, next: 3},
        {id: 3, phase: "fetch", description: "Send RAM data to MDR", action: this.RAMtoMDR, next: 4},
        {id: 4, phase: "fetch", description: "Send MDR data to CIR", action: this.MDRtoCIR, next: 5},
        {id: 5, phase: "fetch", description: "Increment the PC", action: this.incrementPC, next: 6},

        // decode
        {id: 6, phase: "decode", description: "Send instruction from CIR to CU", action: this.CIRtoCU, next: 7},
        {id: 7, phase: "decode", description: "Instruction decoded by the CU", action: this.decodeInstruction, next: 0},

        // add
        {id: 100, phase: "execute", description: "Operand copied to MAR", action: this.operandtoMAR, next: 101},
        {id: 101, phase: "execute", description: "Send MAR value sent to RAM", action: this.MARtoRAM, next: 102},
        {id: 102, phase: "execute", description: "Send Read Signal to RAM", action: this.ReadSignaltoRAM, next: 103},
        {id: 103, phase: "execute", description: "Send RAM data to MDR", action: this.RAMtoMDR, next: 104},
        {
          id: 104,
          phase: "execute",
          description: "ACC and MDR data sent to ALU",
          action: this.MDRandACCtoALU,
          next: 105
        },
        {id: 105, phase: "execute", description: "ALU performs addition", action: this.ALUaddition, next: 106},
        {id: 106, phase: "execute", description: "ALU result send to ACC", action: this.ALUtoACC, next: 0},

        // sub
        {id: 200, phase: "execute", description: "Copy operand to MAR", action: this.operandtoMAR, next: 201},
        {id: 201, phase: "execute", description: "Send MAR value sent to RAM", action: this.MARtoRAM, next: 202},
        {id: 202, phase: "execute", description: "Send Read Signal to RAM", action: this.ReadSignaltoRAM, next: 203},
        {id: 203, phase: "execute", description: "Send RAM data to MDR", action: this.RAMtoMDR, next: 204},
        {
          id: 204,
          phase: "execute",
          description: "ACC and MDR data sent to ALU",
          action: this.MDRandACCtoALU,
          next: 205
        },
        {id: 205, phase: "execute", description: "ALU performs subtraction", action: this.ALUsubtraction, next: 206},
        {id: 206, phase: "execute", description: "ALU result sent to ACC", action: this.ALUtoACC, next: 0},

        // sta
        {id: 300, phase: "execute", description: "Copy operand to MAR", action: this.operandtoMAR, next: 301},
        {id: 301, phase: "execute", description: "ACC value copied to MDR", action: this.ACCtoMDR, next: 302},
        {
          id: 302,
          phase: "execute",
          description: "MAR value sent to RAM",
          action: this.MARtoRAM,
          next: 303
        },
        {id: 303, phase: "execute", description: "Send Write Signal to RAM", action: this.WriteSignaltoRAM, next: 304},
        {
          id: 304,
          phase: "execute",
          description: "MDR value sent to RAM",
          action: this.MDRtoRAM,
          next: 0
        },

        // lda
        {id: 500, phase: "execute", description: "Copy operand to MAR", action: this.operandtoMAR, next: 501},
        {id: 501, phase: "execute", description: "Send MAR value sent to RAM", action: this.MARtoRAM, next: 502},
        {id: 502, phase: "execute", description: "Send Read Signal to RAM", action: this.ReadSignaltoRAM, next: 503},
        {id: 503, phase: "execute", description: "Send RAM data to MDR", action: this.RAMtoMDR, next: 504},
        {id: 504, phase: "execute", description: "Copy MDR data to ACC", action: this.MDRtoACC, next: 0},

        // bra
        {id: 600, phase: "execute", description: "Copy operand to PC", action: this.operandtoPC, next: 0},

        // brz
        {id: 700, phase: "execute", description: "ACC value sent to ALU", action: this.ACCtoALU, next: 701},
        {id: 701, phase: "execute", description: "ACC comparison with zero", action: this.ALUiszero, next: 702},
        {id: 702, phase: "execute", description: "ALU result sent to CU", action: this.ALUtoCU, next: 703},
        {id: 703, phase: "execute", description: "Operand copied to PC", action: this.operandtoPC, next: 0},

        // brp
        {id: 800, phase: "execute", description: "ACC value sent to ALU", action: this.ACCtoALU, next: 801},
        {id: 801, phase: "execute", description: "ACC greater/equal to zero", action: this.ALUispositive, next: 802},
        {id: 802, phase: "execute", description: "ALU result sent to CU", action: this.ALUtoCU, next: 803},
        {id: 803, phase: "execute", description: "Copy operand to PC", action: this.operandtoPC, next: 0},

        // inp/out/otc
        {id: 900, phase: "execute", description: "Waiting for user input", action: this.waitForInput, next: 901},
        {id: 901, phase: "execute", description: "Send input value to ACC", action: this.INPUTtoACC, next: 0},
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

  created() {
    let urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('screenmode')) {
      let mode = urlParams.get('screenmode');

      let classname = "theme-default";
      if (mode === "dark") {
        classname = "theme-dark"
      }

      if (classname !== "theme-default") {
        let allClasses = document.getElementsByClassName("theme-default");
        for (let i = 0; i < allClasses.length; i++) {
          let el = allClasses[i];
          el.classList.remove("theme-default") ;
          el.classList.add(classname) ;
        }
      }
    }
  },

  unmounted() {
    window.removeEventListener('resize', this.scaleMainframe);
  },

  methods: {
    scaleMainframe: function () {
      let widthscale = window.innerWidth / 1280;
      let heightscale = window.innerHeight / 770;
      this.scale = Math.min(widthscale, heightscale);

      document.getElementById("mainframe").setAttribute("style", "transform: scale(" + this.scale + ") translate(-50%, -50%);");
    },

    getOffsetFromMainframe: function (el) {
      let _x = 0;
      let _y = 0;
      let _w = el.offsetWidth;
      let _h = el.offsetHeight;
      let _bw = Math.round(parseFloat(getComputedStyle(el, null).getPropertyValue('border-left-width')));
      while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
        if (el.classList.contains("mainframe")) break;
      }
      let _cx = _x + (_w / 2) + _bw;
      let _cy = _y + (_h / 2) + _bw;
      return {cx: _cx, cy: _cy};
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

    hideElement: function (el) {
      el.style.visibility = "hidden";
    },

    showElement: function (el) {
      el.style.visibility = "visible";
    },

    elementCentreOffset(el) {
      var _w = (el.offsetWidth / 2);
      var _h = (el.offsetHeight / 2);
      return {x: _w, y: _h};
    },

    addOffsetToPosition(pos, offset) {
      pos.cx = pos.cx - offset.x;
      pos.cy = pos.cy - offset.y;
      return pos;
    },

    centreElementOnPoint: function (el, pos) {
      el.style.top = "" + (pos.cy) + "px";
      el.style.left = "" + (pos.cx) + "px";
    },

    centreElementOnElement: function (el, location, offset) {
      var pos = this.getOffsetFromMainframe(location);
      pos = this.addOffsetToPosition(pos, offset);
      this.centreElementOnPoint(el, pos);
    },

    highlightElement(el, highlight) {
      if (highlight) {
        let color = getComputedStyle(el, null).getPropertyValue('--color-highlight');
        el.style.backgroundColor = color;
      } else {
        el.style.backgroundColor = '';
      }
    },

    animateElementBetweenPoints(el, start, end) {
      let offsetx = end.cx - start.cx;
      let offsety = end.cy - start.cy;
      let distance = Math.sqrt((offsetx * offsetx) + (offsety * offsety));
      let animation = el.animate(
        [
          {transform: "translate(0px, 0px)"},
          {transform: "translate(" + (end.cx - start.cx) + "px, " + (end.cy - start.cy) + "px )"}
        ], (0.5 * distance * (100 - (this.speed))) + 200
      )
      return animation.finished;
    },

    async animateElementBetweenElements(el, from, to) {
      this.highlightElement(from, true);
      this.highlightElement(to, true);
      let offset = this.elementCentreOffset(el);
      this.centreElementOnElement(el, from, offset);
      this.showElement(el);
      let start = this.getOffsetFromMainframe(from);
      start = this.addOffsetToPosition(start, offset);
      let end = this.getOffsetFromMainframe(to);
      end = this.addOffsetToPosition(end, offset);
      await this.animateElementBetweenPoints(el, start, end);
      this.hideElement(el);
      this.highlightElement(from, false);
      this.highlightElement(to, false);
    },

    async animateElementBetweenElementsCorner(el, from, to, XthenY) {
      this.highlightElement(from, true);
      this.highlightElement(to, true);
      let offset = this.elementCentreOffset(el);
      let start = this.getOffsetFromMainframe(from);
      start = this.addOffsetToPosition(start, offset);
      let end = this.getOffsetFromMainframe(to);
      end = this.addOffsetToPosition(end, offset);
      let corner = {};
      if (XthenY) {
        corner = {cx: end.cx, cy: start.cy};
      } else {
        corner = {cx: start.cx, cy: end.cy};
      }
      this.centreElementOnElement(el, from, offset);
      this.showElement(el);
      await this.animateElementBetweenPoints(el, start, corner);
      this.centreElementOnPoint(el, corner);
      await this.animateElementBetweenPoints(el, corner, end);
      this.hideElement(el);
      this.highlightElement(from, false);
      this.highlightElement(to, false);
    },

    async animateElementBetweenElementsViaAnchors(el, from, to, anchors) {
      this.highlightElement(from, true);
      this.highlightElement(to, true);

      let offset = this.elementCentreOffset(el);
      let start = this.getOffsetFromMainframe(from);
      start = this.addOffsetToPosition(start, offset);
      let end = this.getOffsetFromMainframe(to);
      end = this.addOffsetToPosition(end, offset);

      var points = [start,];
      for (let i = 0; i < anchors.length; i++) {
        let anchorpoint = this.getOffsetFromMainframe(anchors[i]);
        anchorpoint = this.addOffsetToPosition(anchorpoint, offset);
        points.push(anchorpoint);
      }
      points.push(end);

      this.showElement(el);
      for (let i = 0; i < (points.length - 1); i++) {
        this.centreElementOnPoint(el, points[i]);
        await this.animateElementBetweenPoints(el, points[i], points[i + 1]);
      }

      this.hideElement(el);
      this.highlightElement(from, false);
      this.highlightElement(to, false);
    },


    async PCtoMAR() {
      //animation
      if (this.animations) {
        this.addressValue = this.pc;
        await this.animateElementBetweenElements(this.$refs.address, this.$refs.pc, this.$refs.mar);
      }

      //action
      this.mar = this.pc;
    },

    async MARtoRAM() {
      //animation
      if (this.animations) {
        this.addressValue = this.mar;
        let ramelement = document.getElementById("ram-" + this.mar);
        await this.animateElementBetweenElementsCorner(this.$refs.address, this.$refs.mar, ramelement, true);
      }
      // no action
    },

    async ReadSignaltoRAM() {
      if (this.animations) {
        this.controlSignal = "read";
        await this.animateElementBetweenElements(this.$refs.control, this.$refs.controlstartanchor, this.$refs.controlendanchor);
      }
    },

    async WriteSignaltoRAM() {
      if (this.animations) {
        this.controlSignal = "write";
        await this.animateElementBetweenElements(this.$refs.control, this.$refs.controlstartanchor, this.$refs.controlendanchor);
      }
    },

    async RAMtoMDR() {
      //animation
      if (this.animations) {
        this.dataValue = this.ramarray[this.mar];
        let ramelement = document.getElementById("ram-" + this.mar);
        await this.animateElementBetweenElementsCorner(this.$refs.data, ramelement, this.$refs.mdr, false);
      }

      //action
      this.mdr = this.ramarray[this.mar];
    },

    async MDRtoCIR() {
      //animation
      if (this.animations) {
        this.dataValue = this.mdr;
        await this.animateElementBetweenElements(this.$refs.data, this.$refs.mdr, this.$refs.cir)
      }

      //line highlighting
      this.removeLineHighlight(this.linenumber);
      this.linenumber = this.mar;
      this.addLineHighlight(this.linenumber);

      //action
      this.cir = this.mdr;
    },

    incrementPC: function () {
      //no animation

      //action
      this.pc = this.pc + 1;
    },

    async CIRtoCU() {
      if (this.animations) {
        this.addressValue = this.cir;
        let anchors = [this.$refs.ciranchor, this.$refs.cuanchor]
        this.highlightElement(this.$refs.operand, true);
        await this.animateElementBetweenElementsViaAnchors(this.$refs.address, this.$refs.cir, this.$refs.opcode, anchors);
        this.highlightElement(this.$refs.operand, false);
      }
    },

    async operandtoMAR() {
      if (this.animations) {
        this.addressValue = this.operand;
        let anchors = [this.$refs.cuanchor, this.$refs.maranchor]
        await this.animateElementBetweenElementsViaAnchors(this.$refs.address, this.$refs.operand, this.$refs.mar, anchors);
      }
      this.mar = this.operand;
    },

    async MDRandACCtoALU() {
      //animation
      if (this.animations) {
        this.dataValue = this.mdr;
        await this.animateElementBetweenElementsCorner(this.$refs.data, this.$refs.mdr, this.$refs.alu, true);
        this.dataValue = this.acc;
        await this.animateElementBetweenElementsCorner(this.$refs.data, this.$refs.acc, this.$refs.alu, true);
      }
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

    async ALUtoACC() {
      //animation
      if (this.animations) {
        this.dataValue = this.result;
        await this.animateElementBetweenElementsCorner(this.$refs.data, this.$refs.alu, this.$refs.acc, false);
      }
      this.acc = this.result;
    },

    async ACCtoMDR() {
      if (this.animations) {
        this.dataValue = this.acc;
        await this.animateElementBetweenElements(this.$refs.data, this.$refs.acc, this.$refs.mdr)
      }

      this.mdr = this.acc;
    },

    async MDRtoRAM() {
      //animation
      if (this.animations) {
        this.dataValue = this.mdr;
        let ramelement = document.getElementById("ram-" + this.mar);
        await this.animateElementBetweenElementsCorner(this.$refs.data, this.$refs.mdr, ramelement, true);
      }

      this.ramarray[this.mar] = this.mdr;
    },

    async MDRtoACC() {
      if (this.animations) {
        this.dataValue = this.mdr;
        await this.animateElementBetweenElements(this.$refs.data, this.$refs.mdr, this.$refs.acc)
      }
      this.acc = this.mdr;
    },

    async operandtoPC() {
      if (this.animations) {
        this.addressValue = this.operand;
        let anchors = [this.$refs.cuanchor, this.$refs.pcanchor]
        await this.animateElementBetweenElementsViaAnchors(this.$refs.address, this.$refs.operand, this.$refs.pc, anchors);
      }
      if (this.opcode === 6 || this.result === 1) {
        this.pc = this.operand;
      }
    },

    async ACCtoALU() {
      //animation
      if (this.animations) {
        this.dataValue = this.acc;
        await this.animateElementBetweenElementsCorner(this.$refs.data, this.$refs.acc, this.$refs.alu, true);
      }
    },

    async ALUtoCU() {
      if (this.animations) {
        this.dataValue = this.result;
        let anchors = [this.$refs.aluanchor, this.$refs.decodeanchor]
        await this.animateElementBetweenElementsViaAnchors(this.$refs.data, this.$refs.alu, this.$refs.decodeunit, anchors);
      }
    },

    waitForInput: function () {
      this.waitingforinput = true;
      var textarea = document.getElementById("input");
      this.$nextTick(() => this.$refs.lmcinput.focus())
    },

    async INPUTtoACC() {
      let value = parseInt(this.input);
      if (isNaN(value)) {
        value = 0;
      }
      this.input = "";

      if (this.animations) {
        this.dataValue = value;
        let anchors = [this.$refs.inputanchor, this.$refs.accanchor]
        await this.animateElementBetweenElementsViaAnchors(this.$refs.data, this.$refs.input, this.$refs.acc, anchors);
      }

      this.acc = value;
    },

    scrollOutput: function () {
      this.$nextTick(() => {
          var textarea = this.$refs.lmcoutput;
          textarea.scrollTop = textarea.scrollHeight;
        }
      );
    },

    async ACCtoOUTPUT() {
      if (this.animations) {
        this.dataValue = this.acc;
        let anchors = [this.$refs.accanchor, this.$refs.outputanchor]
        await this.animateElementBetweenElementsViaAnchors(this.$refs.data, this.$refs.acc, this.$refs.output, anchors);
      }
      this.output += (this.acc.toString() + '\n');
      this.scrollOutput();
    },

    ACCtoASCII: function () {
      if (this.acc === 10 || (this.acc >= 32 && this.acc <= 128)) {
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
      this.waitingforinput = false;
      if (this.autorun) {
        setTimeout(function () {
          this.doStep()
        }.bind(this), (1000 - (this.speed * 10)))
      }
    },

    async doStep() {
      if (this.running) {
        if (!this.waitingforinput) {
          // find the action for this state
          let found = false;
          for (var i = 0; i < this.STATES.length; i++) {
            let state = this.STATES[i];
            if (state.id === this.next_state) {
              found = true;
              this.next_state = state.next;
              this.narrative = state.description;
              this.phase = state.phase;
              await state.action();
              break;
            }
          }
          if (!found) {
            console.log("State machine error!")
            this.next_state = 0;
          }

          // if cycle run and the next step is the start of the fetch cycle
          // then turn off autorun until the user presses the button
          if (this.cyclerun && this.next_state === 0) {
            this.autorun = false;
          }

          if (this.autorun) {
            if (this.animations) {
              this.doStep();
            } else {
              setTimeout(function () {
                this.doStep();
              }.bind(this), (1000 - (this.speed * 10)));
            }
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
      this.next_state = 0;
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

    loadCode: function () {
      if (this.codeselect === "add") {
        this.code = add;
      } else if (this.codeselect === "countdown") {
        this.code = countdown;
      } else if (this.codeselect === "greater") {
        this.code = greatest;
      }
      this.$nextTick(() => {
          let event = new Event('input', {bubbles: true,});
          let element = document.getElementById('asmeditor__textarea');
          element.dispatchEvent(event);
        }
      );
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
        const parts = line.split(/(\s+)/).filter(function (e) {
          return e.trim().length > 0;
        });
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
        const parts = line.split(/(\s+)/).filter(function (e) {
          return e.trim().length > 0;
        });
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


