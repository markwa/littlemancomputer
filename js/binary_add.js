// App
const {createApp, ref} = Vue

createApp({
  setup() {
  },
  data: function () {
    return {
      inputA: 0,
      binaryA: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      inputB: 0,
      binaryB: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      result: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      carry: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      calculated_result: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      calculated_carry: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      correct: false,
    }
  },
  mounted: function () {
    // catch window size events
    window.addEventListener('resize', this.scaleMainframe);
    this.scaleMainframe();
    this.randomInputs();
  },

  created() {
  },

  unmounted() {
    window.removeEventListener('resize', this.scaleMainframe);
  },

  methods: {

    reset() {
      this.result = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.carry = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.calculated_result = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.calculated_carry = [0, 0, 0, 0, 0, 0, 0, 0, 0]
    },

    toggleBit(binary_array, bit) {
      document.activeElement.blur();
      if (binary_array[bit] === 0) binary_array[bit] = 1;
      else binary_array[bit] = 0;
      this.check_result();
    },

    toggleInputBit(binary_array, bit) {
      document.activeElement.blur();
      if (binary_array[bit] === 0) binary_array[bit] = 1;
      else binary_array[bit] = 0;
      this.inputA = this.binary2Decimal(this.binaryA);
      this.inputB = this.binary2Decimal(this.binaryB);
      this.reset();
      this.check_result();
    },

    check_result() {
      this.calculated_result = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.calculated_carry = [0, 0, 0, 0, 0, 0, 0, 0, 0];

      // do the sum
      for (let i = 0; i < 8; i++) {
        const sum = this.binaryA[i] + this.binaryB[i] + this.carry[i];
        if (sum === 0) {
          this.calculated_result[i] = 0;
          this.calculated_carry[i + 1] = 0;
        } else if (sum === 1) {
          this.calculated_result[i] = 1;
          this.calculated_carry[i + 1] = 0;
        } else if (sum === 2) {
          this.calculated_result[i] = 0;
          this.calculated_carry[i + 1] = 1;
        } else if (sum === 3) {
          this.calculated_result[i] = 1;
          this.calculated_carry[i + 1] = 1;
        }
      }

      // check the result and the carry
      this.correct = true;
      for (let i = 0; i < 9; i++) {
        if (this.result[i] !== this.calculated_result[i] ||
          this.carry[i] !== this.calculated_carry[i]) {
          this.correct = false;
          break;
        }
      }
    },

    randomValue() {
      return Math.floor(Math.random() * 256);
    },

    randomInputs() {
      this.inputA = this.randomValue();
      this.binaryA = this.decimal2Binary(this.inputA);
      this.inputB = this.randomValue();
      this.binaryB = this.decimal2Binary(this.inputB);
      this.reset();
      this.check_result();
    },

    inputA2Binary() {
      if (this.inputA < 0 || this.inputA > 255) {
        this.inputA = 0;
      }
      this.binaryA = this.decimal2Binary(this.inputA);
      this.reset();
      this.check_result();
    },

    inputB2Binary() {
      if (this.inputB < 0 || this.inputB > 255) {
        this.inputB = 0;
      }
      this.binaryB = this.decimal2Binary(this.inputB);
      this.reset();
      this.check_result();
    },

    decimal2Binary(decimal) {
      var binary = "000000000";
      if (decimal < 0)
        binary = "111111111" + (decimal >>> 0).toString(2);
      else //make sure we have enough zeros
        binary = "000000000" + (decimal >>> 0).toString(2);

      var binary_array = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 9; i++) {
        if (i > 0)
          binary_array[i] = parseInt(binary.slice(-(i + 1), -i));
        else
          binary_array[i] = parseInt(binary.slice(-1));
      }
      return binary_array;
    },

    binary2Decimal(binary_array) {
      var value = 0;
      for (let i = 0; i < 8; i++) {
        if (binary_array[i] === 1) {
          value += 2 ** (i);
        }
      }
      return value;
    },

    scaleMainframe: function () {
      let widthscale = window.innerWidth / 1280;
      let heightscale = window.innerHeight / 770;
      this.scale = Math.min(widthscale, heightscale);

      document.getElementById("mainframe").setAttribute("style", "transform: scale(" + this.scale + ") translate(-50%, -50%);");
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
      this.$forceUpdate();
    },

    isfullscreen: function () {
      return (document.fullScreenElement && document.fullScreenElement !== null);
    },
  }
}).mount('#app')


