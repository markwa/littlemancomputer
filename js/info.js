// App
const {createApp, ref} = Vue


createApp({
  setup() {
  },
  data: function () {
    return {
      scale: 1,
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
      this.scale = Math.min(widthscale, heightscale);

      document.getElementById("mainframe").setAttribute("style", "transform: scale(" + this.scale + ") translate(-50%, -50%);");
    },
  }
}).mount('#app')


