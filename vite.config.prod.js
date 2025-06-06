import { resolve} from 'path'

export default {
  build: {
    sourcemap: true,
    rollupOptions: {
        input: {
            main: resolve(__dirname, 'index.html'),
            dataGenerator: resolve(__dirname, 'data-generator/index.html'),
            about: resolve(__dirname, 'about.html'),
        }
    }
  },
  base: 'https://cajova-houba.rocks/mapa-povesti-z-cech'
}
