const { createApp, ref } = Vue;

createApp({
  data() {
    return {
      players: 6,
      dataArray: {
        name: [],
        verduzco: [],
        mostaza: [],
        marlene: [],
        moradillo: [],
        escarlata: [],
        blanca: [],
        candelabro: [],
        daga: [],
        tubo: [],
        revolver: [],
        soga: [],
        llave: [],
        salon: [],
        billar: [],
        terraza: [],
        comedor: [],
        pasillo: [],
        cocina: [],
        biblioteca: [],
        sala: [],
        estudio: [],
      },
    };
  },
  mounted() {
    for (let item in this.dataArray) {
      if (item == 'name') {
        this.dataArray.name[0] = 'Juan';
      } else this.dataArray[item][0] = false;
    }
    console.log(
      '🚀 ~ file: app.js:35 ~ mounted ~ this.dataArray:',
      this.dataArray
    );
  },
}).mount('#app');
