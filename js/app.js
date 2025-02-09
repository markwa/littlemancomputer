// App
  const { createApp, ref } = Vue

  createApp({
    setup() {
    },
    data : function () {
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
              "      HLT\n"+
              " data DAT",
        input: "13",
        output: "15",
        codeselect: "add",
      }
    },
    methods: {
      formatInt: function( num , places ){
          if ( num < 0 ){
            return '-'+String(Math.abs(num)).padStart(places, '0')
          } else {
            return String(num).padStart(places, '0')
          }
      },

      assembleCodeToRam: function() {
        // define the opcodes
        const mnenomics = ["hlt","add","sub","sta","!!!","lda","bra","brz","brp","inp","out","otc","dat"];

        let labels = {} ;
        const lines = this.code.split('\n');

        // perform an initial pass looking for labels
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          const parts = line.split(' ');
          var opcode = -1;
          for (var j = 0; j < parts.length; j++) {
            var part = parts[j].trim();
            part = part.toLowerCase();
            if( part !== '' && opcode < 0 ) {
              let index = mnenomics.indexOf(part);
              if (index >= 0) {
                opcode = index;
              } else {
                labels[i]=part;
              }
            }
          }
        }

        console.log( labels )
      },
    }
  }).mount('#app')
