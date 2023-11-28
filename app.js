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
        for (let cont = 0; cont < this.players; cont++) {
          this.dataArray.name[cont] = 'Juan ' + (cont + 1);
        }
      } else {
        for (let cont = 0; cont < this.players; cont++) {
          this.dataArray[item][cont] = false;
        }
      }
    }
    console.log(
      '🚀 ~ file: app.js:35 ~ mounted ~ this.dataArray:',
      this.dataArray
    );
  },
}).mount('#app');
