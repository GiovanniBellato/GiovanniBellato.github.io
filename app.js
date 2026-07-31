const Fullscreen = {
    data(){
        return{
            viaggi: null,
            embla: null,
            isScrolling: false,
            showArrows: true, // Variabile per controllare la visibilità
            arrowTimer: null  // Riferimento al timer
        }
    },
    methods:{
        getData: function(){
            axios.get("immagini.json")
                .then(response => {
                    this.viaggi = response.data;
                    this.$nextTick(() => {
                        this.embla = EmblaCarousel(this.$refs.emblaRef, { loop: false });
                    });
                });
        },
        prev(){
            if(this.embla) this.embla.scrollPrev();
            this.resetArrowTimer(); // Mostra le frecce quando clicchi
        },
        next(){
            if(this.embla) this.embla.scrollNext();
            this.resetArrowTimer(); // Mostra le frecce quando clicchi
        },
        handleWheel(e) {
            this.resetArrowTimer(); // Mostra le frecce quando scorri col trackpad
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                if (!this.isScrolling) {
                    if (e.deltaX > 20) {
                        this.next();
                        this.lockScroll();
                    } else if (e.deltaX < -20) {
                        this.prev();
                        this.lockScroll();
                    }
                }
            }
        },
        lockScroll() {
            this.isScrolling = true;
            setTimeout(() => {
                this.isScrolling = false;
            }, 500); 
        },
        // Metodo per resettare il timer di scomparsa delle frecce
        resetArrowTimer() {
            this.showArrows = true; // Mostra le frecce
            if (this.arrowTimer) clearTimeout(this.arrowTimer); // Cancella il timer precedente
            
            // Imposta un nuovo timer: dopo 2.5 secondi di inattività, le nasconde
            this.arrowTimer = setTimeout(() => {
                this.showArrows = false;
            }, 2500);
        }
    },
    mounted() {
        this.getData();
        
        window.addEventListener('wheel', this.handleWheel, { passive: false });
        
        // Ascoltiamo i movimenti del mouse e del touch per far riapparire le frecce
        window.addEventListener('mousemove', this.resetArrowTimer);
        window.addEventListener('touchstart', this.resetArrowTimer);
        
        // Avviamo il timer appena la pagina carica
        this.resetArrowTimer();
    },
    beforeUnmount() {
        if(this.embla) this.embla.destroy();
        window.removeEventListener('wheel', this.handleWheel);
        
        // Pulizia degli eventi e del timer
        window.removeEventListener('mousemove', this.resetArrowTimer);
        window.removeEventListener('touchstart', this.resetArrowTimer);
        if (this.arrowTimer) clearTimeout(this.arrowTimer);
    },

    template: `
    <section class="h-full relative">
        <div class="overflow-hidden w-full h-full touch-pan-y" ref="emblaRef"> 
            <div class="flex h-full items-center"> 
                
                <!-- AGGIUNTA LA CLASSE "no-scrollbar" QUI SOTTO -->
                <article class="flex-none w-full h-full overflow-y-auto snap-y snap-mandatory no-scrollbar" v-for="viaggio in viaggi" :key="viaggio.trip + viaggio.date"> 
                    
                    <div v-for="foto in viaggio.foto" :key="foto.src" class="w-full h-[95%] flex flex-col items-center justify-center snap-start snap-always p-2 md:p-4">
                        
                        <div class="w-full flex-1 min-h-0 flex items-center justify-center">
                            <img :src="foto.src" :alt="foto.alt" class="max-w-full max-h-full object-contain drop-shadow-md"/>
                        </div>
                        
                        <div class="w-full flex-shrink-0 text-left pt-2 md:pt-4 pl-2 md:pl-6">
                            <span class="text-[10px] md:text-xs text-muted uppercase tracking-widest pointer-events-none select-none">
                                {{ viaggio.trip }} &mdash; {{ viaggio.date }}
                            </span>
                        </div>

                    </div>
                    
                </article>
            </div>
        </div>

        <!-- FRECCIA SINISTRA / PRECEDENTE -->
        <button @click="prev" 
                class="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-2 text-muted transition-all duration-700 ease-in-out z-50 cursor-pointer"
                :class="showArrows ? 'opacity-30 hover:opacity-100 hover:text-ink' : 'opacity-0 pointer-events-none'">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 md:w-12 md:h-12">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        </button>

        <!-- FRECCIA DESTRA / SUCCESSIVA -->
        <button @click="next" 
                class="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-2 text-muted transition-all duration-700 ease-in-out z-50 cursor-pointer"
                :class="showArrows ? 'opacity-30 hover:opacity-100 hover:text-ink' : 'opacity-0 pointer-events-none'">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 md:w-12 md:h-12">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
        </button>

    </section>
    `
}

const Gallery = {
    data(){
        return{
            viaggi: null,
            fotoSelezionata: null
        }
    },
    methods:{
        getData: function(){
            axios.get("./immagini.json")
                .then(response =>{
                    this.viaggi = response.data
                });
        },
        apriFoto(foto) {
            this.fotoSelezionata = foto;
        },
        chiudiFoto() {
            this.fotoSelezionata = null;
        },
        // Nuova funzione per generare la miniatura ottimizzata tramite Cloudinary
        getThumbnail(url) {
            if (!url) return "";
            // Inseriamo i parametri di trasformazione subito dopo "upload/"
            // w_400,h_400 = 400x400 pixel
            // c_fill = taglia i bordi in eccesso
            // q_auto,f_auto = compressione automatica e formato WebP/AVIF se supportato
            return url.replace('/upload/', '/upload/w_400,h_400,c_fill,q_auto,f_auto/');
        },
        // Ottimizziamo anche l'immagine grande nel lightbox
        getOptimizedFull(url) {
            if (!url) return "";
            // Ridimensioniamo l'immagine grande per evitare di caricare file da 20MB
            // w_1920 = larghezza massima 1920px (Full HD)
            return url.replace('/upload/', '/upload/w_1920,q_auto,f_auto/');
        }
    },
    mounted() {
        this.getData();
    },

    template: `
    <div class="w-full">
        <!-- Griglia di miniature -->
        <section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            
            <template v-for="viaggio in viaggi" :key="viaggio.trip + viaggio.date">
                <div v-for="foto in viaggio.foto" :key="foto.src" 
                     class="aspect-square overflow-hidden bg-gray-100 cursor-pointer group"
                     @click="apriFoto(foto)">
                    
                    <!-- USIAMO getThumbnail E loading="lazy" -->
                    <img :src="getThumbnail(foto.src)" :alt="foto.alt" 
                         loading="lazy"
                         class="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-80 transition-all duration-300"/>
                
                </div>
            </template>
        </section>

        <!-- Lightbox -->
        <div v-if="fotoSelezionata" 
             class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
             @click="chiudiFoto">
            
            <button class="absolute top-6 right-6 text-white text-4xl hover:text-gray-400 z-50 transition-colors" 
                    @click.stop="chiudiFoto">&times;</button>
            
            <!-- USIAMO getOptimizedFull per la visualizzazione grande -->
            <img :src="getOptimizedFull(fotoSelezionata.src)" :alt="fotoSelezionata.alt" 
                 class="max-w-full max-h-full object-contain shadow-2xl" 
                 @click.stop /> 
        </div>
    </div>
    `
}

const routes = [
    {path:"/", redirect: "/fullscreen"},
    {path:"/fullscreen", component: Fullscreen},
    {path:"/gallery", component: Gallery}
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes
});

const app = Vue.createApp({});
app.use(router);
app.mount("#app");