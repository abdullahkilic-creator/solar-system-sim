import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- 🌐 DİL AYARI VE SÖZLÜK ---
const LANG_STORAGE_KEY = 'solar-sim-lang';

function loadSavedLang() {
    try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        if (saved === 'tr' || saved === 'en') return saved;
    } catch (e) { /* gizli sekme vb. */ }
    return 'tr';
}

export let currentLang = loadSavedLang();

const UI_TRANSLATIONS = {
    tr: {
        title: "Güneş Sistemi",
        resetView: "Görünümü Sıfırla",
        orbitSpeed: "Yörünge Hızı",
        pause: "Simülasyonu Durdur",
        resume: "Simülasyonu Devam Ettir",
        physAttrs: "📊 Fiziksel Özellikler",
        type: "Tür:",
        mass: "Kütle:",
        period: "Yörünge Dönemi:",
        rotation: "Dönüş Süresi:",
        moons: "Aylar:",
        tilt: "Eksen Eğikliği:",
        envHab: "🌡️ Çevre & Yaşanılabilirlik",
        temp: "Sıcaklık:",
        colony: "Koloni Durumu:",
        history: "🏛️ Tarih & Mitoloji",
        missions: "🚀 Uzay Görevleri",
        scale: "📐 Boyut Karşılaştırması (Dünya ile)",
        sunRatio: "109x Dünya Çapı (Devasa Yıldız)",
        earthRatio: "Dünya Çapı",
        planetsMenuBtn: "🪐 Gezegenler",
        soundOn: "🔊 Ses Açık",
        soundOff: "🔇 Ses Kapalı",
        labels: "Etiketler",
        orbits: "Yörüngeler",
        langBtn: "EN",
        hint: "Boşluk: durdur · Esc: sıfırla · 0-8: gezegen seç · ←/→: önceki/sonraki"
    },
    en: {
        title: "Solar System",
        resetView: "Reset View",
        orbitSpeed: "Orbit Speed",
        pause: "Pause Simulation",
        resume: "Resume Simulation",
        physAttrs: "📊 Physical Attributes",
        type: "Type:",
        mass: "Mass:",
        period: "Orbit Period:",
        rotation: "Rotation:",
        moons: "Moons:",
        tilt: "Axial Tilt:",
        envHab: "🌡️ Environment & Habitability",
        temp: "Temperature:",
        colony: "Colony Status:",
        history: "🏛️ History & Mythology",
        missions: "🚀 Space Missions",
        scale: "📐 Scale Comparison (vs Earth)",
        sunRatio: "109x Earth Diameter (Massive Star)",
        earthRatio: "Earth Diameter",
        planetsMenuBtn: "🪐 Planets",
        soundOn: "🔊 Sound On",
        soundOff: "🔇 Sound Off",
        labels: "Labels",
        orbits: "Orbits",
        langBtn: "TR",
        hint: "Space: pause · Esc: reset · 0-8: select planet · ←/→: previous/next"
    }
};

// Hem düz metin hem de { tr, en } nesnesi olan alanları okur
const localized = (value) => {
    if (value == null) return "-";
    return typeof value === 'object' ? value[currentLang] : value;
};

// --- 📸 GERÇEKÇİ UZAY FOTOĞRAFLARI (Doğrudan URL Olarak) ---
const PLANET_MENU_IMAGES = {
    sun: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=150&auto=format&fit=crop",
    mercury: "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?q=80&w=150&auto=format&fit=crop",
    venus: "https://images.unsplash.com/photo-1614314107768-6018061b5b72?q=80&w=150&auto=format&fit=crop",
    earth: "/dunya.png",
    mars: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=150&auto=format&fit=crop",
    jupiter: "/jupiter.png",
    saturn: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=150&auto=format&fit=crop",
    uranus: "/uranus.png",
    neptune: "/neptun.png"
};

const PLANET_DATA = {
    sun: { 
        name: { tr: "Güneş", en: "Sun" }, size: 25, dist: 0, speed: 0, rotSpeed: 0.002, color: 0xffaa00, menuImg: PLANET_MENU_IMAGES.sun,
        type: { tr: "Sarı Cüce Yıldız", en: "Yellow Dwarf Star" }, mass: "1.989 × 10^30 kg", period: { tr: "Yok", en: "N/A" }, 
        rotation: { tr: "25-35 Gün", en: "25-35 Days" }, moons: "0", 
        temp: { tr: "5,500 °C (Yüzey)", en: "5,500 °C (Surface)" }, 
        colony: { tr: "İmkansız - Saf plazma yıldızı.", en: "Impossible - Star of pure plasma." }, 
        myth: { tr: "Adını eski Roma güneş tanrısı Sol'dan almıştır.", en: "Named after Sol, the ancient Roman sun god." }, 
        missions: "SOHO, Parker Solar Probe", earthRatio: 109,
        desc: { 
            tr: "Güneş Sistemi'nin merkezindeki yıldız. Çekirdeğindeki nükleer füzyon reaksiyonlarıyla ısınan, neredeyse mükemmel bir sıcak plazma küresidir.", 
            en: "The star at the center of the Solar System. It is a nearly perfect ball of hot plasma, heated to incandescence by nuclear fusion reactions in its core." 
        }
    },
    mercury: { 
        name: { tr: "Merkür", en: "Mercury" }, size: 1.2, dist: 40, speed: 0.03, rotSpeed: 0.01, inclination: 7.0, tilt: 0.03, color: 0x888888, menuImg: PLANET_MENU_IMAGES.mercury,
        type: { tr: "Karasal Gezegen", en: "Terrestrial Planet" }, mass: "3.285 × 10^23 kg", 
        period: { tr: "88 Dünya Günü", en: "88 Earth Days" }, rotation: { tr: "59 Dünya Günü", en: "59 Earth Days" }, moons: "0", 
        temp: "-173°C / 427°C", 
        colony: { tr: "Çok Zor - Aşırı sıcaklık dalgalanmaları ve atmosfer yok.", en: "Very Difficult - Extreme temperature swings and no atmosphere." }, 
        myth: { tr: "Hızlı yörüngesinden dolayı adını Roma elçi tanrısından almıştır.", en: "Named after the swift Roman messenger god due to its fast orbit." }, 
        missions: "Mariner 10, MESSENGER, BepiColombo", earthRatio: 0.38,
        desc: { 
            tr: "Güneşe en yakın ve en küçük gezegen. Gündüzleri kavurucu sıcaklardan geceleri dondurucu soğuklara kadar aşırı sıcaklık değişimleri yaşar.", 
            en: "The smallest and closest planet to the Sun. It experiences extreme temperature variations ranging from blistering heat during the day to freezing cold at night." 
        }
    },
    venus: { 
        name: { tr: "Venüs", en: "Venus" }, size: 2.2, dist: 55, speed: 0.02, rotSpeed: -0.002, inclination: 3.4, tilt: 2.6, color: 0xe3bb76, menuImg: PLANET_MENU_IMAGES.venus,
        type: { tr: "Karasal Gezegen", en: "Terrestrial Planet" }, mass: "4.867 × 10^24 kg", 
        period: { tr: "225 Dünya Günü", en: "225 Earth Days" }, rotation: { tr: "243 Dünya Günü", en: "243 Earth Days" }, moons: "0", 
        temp: "464 °C", 
        colony: { tr: "Düşmanca - Asit yağmurları, ezici atmosfer basıncı ve sera etkisi.", en: "Hostile - Acid rain, crushing atmospheric pressure, runaway greenhouse effect." }, 
        myth: { tr: "Çok parlak parladığı için adını Roma aşk ve güzellik tanrıçasından almıştır.", en: "Named after the Roman god of love and beauty because it shone so brightly." }, 
        missions: "Venera 7, Magellan, Akatsuki", earthRatio: 0.95,
        desc: { 
            tr: "Benzer boyutundan dolayı genellikle Dünya'nın ikizi olarak adlandırılır. Yoğun sera etkisiyle sistemimizin en sıcak gezegenidir.", 
            en: "Often called Earth's twin due to similar size, Venus has a runaway greenhouse effect making it the hottest planet in our solar system with crushing atmospheric pressures." 
        }
    },
    earth: { 
        name: { tr: "Dünya", en: "Earth" }, size: 2.5, dist: 75, speed: 0.015, rotSpeed: 0.02, inclination: 0.0, tilt: 23.4, color: 0x2b82c9, menuImg: PLANET_MENU_IMAGES.earth,
        type: { tr: "Karasal Gezegen", en: "Terrestrial Planet" }, mass: "5.972 × 10^24 kg", 
        period: { tr: "365.25 Gün", en: "365.25 Days" }, rotation: { tr: "24 Saat", en: "24 Hours" }, moons: { tr: "1 (Ay)", en: "1 (The Moon)" }, 
        temp: { tr: "15 °C (Ort.)", en: "15 °C (Avg)" }, 
        colony: { tr: "Ev - Biyolojik karbon tabanlı yaşam için ideal koşullar.", en: "Home - Ideal conditions for biological organic carbon-based life." }, 
        myth: { tr: "Yunan/Roma tanrılarının adı verilmeyen tek gezegendir. Anlamı 'Toprak'tır.", en: "The only planet not named after a Greek/Roman deity. Name means 'Ground'." }, 
        missions: "ISS, Hubble, uydular...", earthRatio: 1.0,
        desc: { 
            tr: "Evimiz. Sıvı yüzey suyu ve dinamik koruyucu atmosferi sayesinde yaşama ev sahipliği yaptığı bilinen tek gök cismidir.", 
            en: "Our home planet. It is the only known astronomical object known to harbor and support life, thanks to its liquid surface water and dynamic protective atmosphere." 
        }
    },
    mars: { 
        name: { tr: "Mars", en: "Mars" }, size: 1.5, dist: 95, speed: 0.01, rotSpeed: 0.018, inclination: 1.8, tilt: 25.2, color: 0xc1440e, menuImg: PLANET_MENU_IMAGES.mars,
        type: { tr: "Karasal Gezegen", en: "Terrestrial Planet" }, mass: "6.39 × 10^23 kg", 
        period: { tr: "687 Dünya Günü", en: "687 Earth Days" }, rotation: { tr: "24.6 Saat", en: "24.6 Hours" }, moons: "2 (Phobos, Deimos)", 
        temp: "-62 °C", 
        colony: { tr: "Umut Verici - İnsan kolonizasyonu için en büyük hedef. Yüzey altında buz kütleleri var.", en: "Promising - Top target for human colonization. Water ice exists under the surface." }, 
        myth: { tr: "Kan kırmızısı görünümünden dolayı Roma savaş tanrısının adı verilmiştir.", en: "Named after the Roman god of war due to its blood-red appearance." }, 
        missions: "Viking 1, Curiosity, Perseverance, Tianwen-1", earthRatio: 0.53,
        desc: { 
            tr: "Kızıl Gezegen. Çok ince bir atmosfere sahip, tozlu, soğuk bir çöl dünyasıdır. Milyarlarca yıl önce daha ıslak ve sıcak olduğuna dair kanıtlar vardır.", 
            en: "The Red Planet. Mars is a dusty, cold, desert world with a very thin atmosphere. There is strong scientific evidence that Mars was once much wetter and warmer billions of years ago." 
        }
    },
    jupiter: { 
        name: { tr: "Jüpiter", en: "Jupiter" }, size: 7.5, dist: 140, speed: 0.007, rotSpeed: 0.04, inclination: 1.3, tilt: 3.1, color: 0xd8ca9d, menuImg: PLANET_MENU_IMAGES.jupiter,
        type: { tr: "Gaz Dev", en: "Gas Giant" }, mass: "1.898 × 10^27 kg", 
        period: { tr: "12 Dünya Yılı", en: "12 Earth Years" }, rotation: { tr: "9.9 Saat", en: "9.9 Hours" }, moons: { tr: "97 onaylanmış", en: "97 confirmed" }, 
        temp: "-108 °C", 
        colony: { tr: "İmkansız - Yoğun radyasyon ve muazzam kütleçekimine sahip gaz devi.", en: "Impossible - Gas giant with immense radiation and gravity fields." }, 
        myth: { tr: "Mutlak hakimiyeti temsil eden Roma tanrılarının kralının adı verilmiştir.", en: "Named after the king of the Roman gods, representing absolute dominance." }, 
        missions: "Voyager 1, Galileo, Cassini, Juno", earthRatio: 11.2,
        desc: { 
            tr: "Güneş sistemindeki en büyük gezegen. Diğer tüm gezegenlerin toplamından iki kat daha büyük kütleye sahiptir. Büyük Kırmızı Lekesi ile ünlüdür.", 
            en: "The largest planet in our solar system. Twice as massive as all other planets combined, it is famous for its colorful bands of gas and the Great Red Spot—a massive centuries-old storm." 
        }
    },
    saturn: { 
        name: { tr: "Satürn", en: "Saturn" }, size: 6.0, dist: 185, speed: 0.005, rotSpeed: 0.035, inclination: 2.5, tilt: 26.7, color: 0xe2bf7d, hasRings: true, menuImg: PLANET_MENU_IMAGES.saturn,
        type: { tr: "Gaz Dev", en: "Gas Giant" }, mass: "5.683 × 10^26 kg", 
        period: { tr: "29 Dünya Yılı", en: "29 Earth Years" }, rotation: { tr: "10.7 Saat", en: "10.7 Hours" }, moons: { tr: "274 onaylanmış", en: "274 confirmed" }, 
        temp: "-139 °C", 
        colony: { tr: "İmkansız - Ancak Titan veya Enceladus gibi uyduları koloni için çok popüler adaylardır.", en: "Impossible - However, its moons like Titan or Enceladus are colony hot-spots." }, 
        myth: { tr: "Adını Roma tarım ve zenginlik tanrısından almıştır.", en: "Named after the Roman god of agriculture and wealth." }, 
        missions: "Pioneer 11, Voyager 2, Cassini-Huygens", earthRatio: 9.45,
        desc: { 
            tr: "Göz kamaştırıcı, karmaşık buz halkalarıyla süslenmiş bir dev. Büyük ölçüde hidrojen ve helyumdan oluştuğu için sistemin en az yoğun gezegenidir.", 
            en: "Adorned with a dazzling, complex system of icy rings, Saturn is a giant gas planet mostly composed of hydrogen and helium, making it the least dense planet in the system." 
        }
    },
    uranus: { 
        name: { tr: "Uranüs", en: "Uranus" }, size: 4.0, dist: 230, speed: 0.003, rotSpeed: -0.03, inclination: 0.8, tilt: 97.8, color: 0x4b70dd, menuImg: PLANET_MENU_IMAGES.uranus,
        type: { tr: "Buz Devi", en: "Ice Giant" }, mass: "8.681 × 10^25 kg", 
        period: { tr: "84 Dünya Yılı", en: "84 Earth Years" }, rotation: { tr: "17.2 Saat", en: "17.2 Hours" }, moons: "29", 
        temp: "-224 °C", 
        colony: { tr: "İmkansız - Ekstrem rüzgarlar ve dondurucu atmosferik koşullar.", en: "Impossible - Extreme ice-gas atmospheric winds and extreme cold." }, 
        myth: { tr: "Adını antik Yunan gökyüzü tanrısından almıştır, Kronos'un babasıdır.", en: "Named after the ancient Greek deity of the sky, father of Cronus." }, 
        missions: "Voyager 2 (1986'da tek yakın geçiş)", earthRatio: 4.0,
        desc: { 
            tr: "Metan gazının neden olduğu soluk mavi renge sahip bir buz devi. Yaklaşık 98 derecelik eksen eğikliği ile tamamen yan yatmış şekilde dönmesiyle benzersizdir.", 
            en: "An ice giant with a unique pale-blue hue caused by methane gas. It is unique for rotating entirely on its side with an axial tilt of nearly 98 degrees." 
        }
    },
    neptune: { 
        name: { tr: "Neptün", en: "Neptune" }, size: 3.8, dist: 270, speed: 0.002, rotSpeed: 0.032, inclination: 1.8, tilt: 28.3, color: 0x274687, menuImg: PLANET_MENU_IMAGES.neptune,
        type: { tr: "Buz Devi", en: "Ice Giant" }, mass: "1.024 × 10^26 kg", 
        period: { tr: "165 Dünya Yılı", en: "165 Earth Years" }, rotation: { tr: "16 Saat", en: "16 Hours" }, moons: "16", 
        temp: "-201 °C", 
        colony: { tr: "İmkansız - Saatte 2.100 km hıza ulaşan süpersonik metan rüzgarları.", en: "Impossible - Whipped by supersonic methane winds up to 2,100 km/h." }, 
        myth: { tr: "Derin okyanus mavisi görünümü nedeniyle Roma deniz tanrısının adı verilmiştir.", en: "Named after the Roman god of the sea because of its deep ocean-blue look." }, 
        missions: "Voyager 2 (1989)", earthRatio: 3.88,
        desc: { 
            tr: "Güneşimize en uzak ana gezegen. Karanlık, soğuk ve süpersonik rüzgarlarla savrulan bu buz devi, teleskop yerine matematiksel hesaplamalarla keşfedilen ilk gezegendir.", 
            en: "The most distant major planet orbiting our Sun. Dark, cold, and whipped by supersonic winds, this ice giant was the first planet located via mathematical calculations rather than telescope exploration." 
        }
    }
};

const PLANET_ORDER = Object.keys(PLANET_DATA); // 0: Güneş, 1: Merkür ... 8: Neptün
const HOME_POSITION = new THREE.Vector3(0, 150, 300);
const MOON_DISTANCE = 5;

export default class App {
    constructor() {
        this.state = {
            speedMultiplier: 1.0,
            isPaused: false,
            targetObject: null,
            isTransitioning: false,
            returningHome: false,
            soundEnabled: true,
            showLabels: true,
            showOrbits: true
        };
        this.planets = {};
        this.orbitLines = [];
        this.lastTargetPos = new THREE.Vector3();
        this.lastTime = performance.now();
        this.init();

        window.changeLanguage = (lang) => this.switchLanguage(lang);
    }

    // ------------------------------------------------------------------
    // DİL
    // ------------------------------------------------------------------
    switchLanguage(lang) {
        currentLang = lang;
        try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) { /* yoksay */ }
        document.documentElement.lang = lang;
        document.title = UI_TRANSLATIONS[lang].title;

        this.buildUI();
        this.bindUIEvents();

        PLANET_ORDER.forEach(id => {
            const lbl = document.getElementById(`lbl-${id}`);
            if (lbl) lbl.textContent = PLANET_DATA[id].name[currentLang];
        });

        // Kamerayı yeniden uçurmadan sadece bilgi panelinin metnini yenile
        if (this.state.targetObject) {
            this.fillInfoPanel(this.state.targetObject.userData.id);
            document.getElementById('info-panel').classList.add('active');
        }
    }

    // ------------------------------------------------------------------
    // KURULUM
    // ------------------------------------------------------------------
    createProceduralTexture(colorHex, isSun = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        const baseColor = new THREE.Color(colorHex);

        if (isSun) {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.2, baseColor.getStyle());
            gradient.addColorStop(1, '#ff3300');
        } else {
            gradient.addColorStop(0, baseColor.getStyle());
            gradient.addColorStop(0.5, '#' + baseColor.clone().offsetHSL(0, -0.2, -0.2).getHexString());
            gradient.addColorStop(1, baseColor.getStyle());
        }
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < (isSun ? 40 : 20); i++) {
            ctx.fillStyle = `rgba(${isSun ? '255,200,0' : '255,255,255'}, ${Math.random() * 0.15})`;
            ctx.fillRect(0, Math.random() * canvas.height, canvas.width, Math.random() * 20);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    init() {
        document.documentElement.lang = currentLang;
        document.title = UI_TRANSLATIONS[currentLang].title;
        this.buildUI();

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.0008);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.copy(HOME_POSITION);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 600;
        this.controls.minDistance = 10;
        this.controls.zoomToCursor = true;
        // Kullanıcı kamerayı tutunca otomatik kamera hareketlerini bırak
        this.controls.addEventListener('start', () => {
            this.state.isTransitioning = false;
            this.state.returningHome = false;
        });

        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);
        this.spaceSound = new THREE.Audio(this.audioListener);
        this.setupProceduralAudio();

        this.scene.add(new THREE.AmbientLight(0x333333));
        this.scene.add(new THREE.PointLight(0xffffff, 4.5, 1000, 0.5));

        this.createStars();
        this.createSun();
        this.createPlanets();
        this.createAsteroidBelt();
        this.setupPostProcessing();
        this.setupSceneInteractions();
        this.bindUIEvents();

        window.addEventListener('resize', () => this.onWindowResize());
        this.animate();
    }

    // ------------------------------------------------------------------
    // SES
    // ------------------------------------------------------------------
    setupProceduralAudio() {
        const ctx = THREE.AudioContext.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, ctx.currentTime);
        osc.connect(filter);
        filter.connect(gain);
        this.spaceSound.setNodeSource(gain);
        this.spaceGainNode = gain;
        this.spaceOscillator = osc;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        osc.start(0);

        // Tarayıcılar sesi ilk kullanıcı etkileşimine kadar askıya alır; ilk tıklamada açıyoruz.
        const unlock = () => {
            if (ctx.state === 'suspended') ctx.resume();
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
    }

    rampVolume(target, seconds) {
        if (!this.spaceGainNode) return;
        const ctx = THREE.AudioContext.getContext();
        const g = this.spaceGainNode.gain;
        g.cancelScheduledValues(ctx.currentTime);
        g.setValueAtTime(g.value, ctx.currentTime);
        g.linearRampToValueAtTime(target, ctx.currentTime + seconds);
    }

    playPlanetSound(id) {
        if (!this.spaceGainNode || !this.state.soundEnabled) return;
        const ctx = THREE.AudioContext.getContext();
        if (ctx.state === 'suspended') ctx.resume();
        const frequencies = { sun: 80, mercury: 180, venus: 150, earth: 130, mars: 160, jupiter: 90, saturn: 100, uranus: 110, neptune: 115 };
        this.spaceOscillator.frequency.setTargetAtTime(frequencies[id] || 120, ctx.currentTime, 0.1);
        this.rampVolume(0.2, 0.5);
    }

    stopPlanetSound() {
        this.rampVolume(0, 0.3);
    }

    // ------------------------------------------------------------------
    // SAHNE NESNELERİ
    // ------------------------------------------------------------------
    createStars() {
        const starCount = 3500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i += 3) {
            const radius = 600 + Math.random() * 400;
            const u = Math.random(), v = Math.random();
            const theta = u * 2.0 * Math.PI, phi = Math.acos(2.0 * v - 1.0);
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
            const brightness = 0.5 + Math.random() * 0.5;
            colors[i] = brightness; colors[i + 1] = brightness + (Math.random() * 0.2); colors[i + 2] = brightness + 0.3;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const material = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 0.9 });
        this.starsParticleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.starsParticleSystem);
    }

    createSun() {
        const data = PLANET_DATA.sun;
        const geometry = new THREE.SphereGeometry(data.size, 64, 64);
        const material = new THREE.MeshBasicMaterial({ map: this.createProceduralTexture(data.color, true), color: 0xffddaa });
        this.sunMesh = new THREE.Mesh(geometry, material);
        this.sunMesh.userData = { id: 'sun', config: data };
        this.scene.add(this.sunMesh);
        this.createHTMLLabel('sun', data.name[currentLang]);
    }

    createPlanets() {
        PLANET_ORDER.forEach((key) => {
            if (key === 'sun') return;
            const data = PLANET_DATA[key];

            // Yörünge düzlemi (eğik)
            const orbitPivot = new THREE.Group();
            orbitPivot.rotation.z = THREE.MathUtils.degToRad(data.inclination || 0);
            this.scene.add(orbitPivot);

            const points = [];
            for (let i = 0; i <= 128; i++) {
                const theta = (i / 128) * Math.PI * 2;
                points.push(new THREE.Vector3(Math.cos(theta) * data.dist, 0, Math.sin(theta) * data.dist));
            }
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({ color: 0x0096ff, transparent: true, opacity: 0.15 });
            const orbitLine = new THREE.Line(lineGeo, lineMat);
            orbitPivot.add(orbitLine);
            this.orbitLines.push(orbitLine);

            // holder: yörüngede ilerleyen nokta. Ay buna bağlı, böylece gezegenin
            // kendi dönüşünden ve eksen eğikliğinden etkilenmiyor.
            const holder = new THREE.Group();
            orbitPivot.add(holder);

            const geometry = new THREE.SphereGeometry(data.size, 32, 32);
            const material = new THREE.MeshStandardMaterial({ map: this.createProceduralTexture(data.color, false), roughness: 0.8, metalness: 0.1 });
            const planetMesh = new THREE.Mesh(geometry, material);
            // Önce kendi ekseninde dön (Y), sonra eksen eğikliğini uygula (Z)
            planetMesh.rotation.order = 'ZYX';
            planetMesh.rotation.z = THREE.MathUtils.degToRad(data.tilt || 0);
            planetMesh.userData = { id: key, config: data };
            holder.add(planetMesh);

            if (data.hasRings) {
                const ringGeo = new THREE.RingGeometry(data.size * 1.4, data.size * 2.3, 64);
                ringGeo.rotateX(Math.PI / 2);
                const ringMat = new THREE.MeshStandardMaterial({ color: 0xa89370, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
                planetMesh.add(new THREE.Mesh(ringGeo, ringMat));
            }

            const entry = { pivot: orbitPivot, holder, mesh: planetMesh, speed: data.speed, rotSpeed: data.rotSpeed, angle: Math.random() * Math.PI * 2 };

            if (key === 'earth') {
                const moon = new THREE.Mesh(
                    new THREE.SphereGeometry(0.5, 16, 16),
                    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 })
                );
                moon.position.x = MOON_DISTANCE;
                holder.add(moon);
                entry.moon = moon;
                entry.moonAngle = 0;
            }

            this.planets[key] = entry;
            this.createHTMLLabel(key, data.name[currentLang]);
        });
    }

    createAsteroidBelt() {
        const count = 600; const geometry = new THREE.BufferGeometry(); const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            const radius = 108 + Math.random() * 17; const angle = Math.random() * Math.PI * 2;
            positions[i] = Math.cos(angle) * radius; positions[i + 1] = (Math.random() - 0.5) * 4; positions[i + 2] = Math.sin(angle) * radius;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: 0x776e65, size: 0.8, transparent: true, opacity: 0.6 });
        this.asteroidBelt = new THREE.Points(geometry, material);
        this.scene.add(this.asteroidBelt);
    }

    setupPostProcessing() {
        const renderPass = new RenderPass(this.scene, this.camera);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.25);
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(bloomPass);
        this.composer.addPass(new OutputPass());
    }

    // ------------------------------------------------------------------
    // ETİKETLER
    // ------------------------------------------------------------------
    createHTMLLabel(id, text) {
        const oldLbl = document.getElementById(`lbl-${id}`);
        if (oldLbl) oldLbl.remove();

        const div = document.createElement('div');
        div.className = 'planet-label'; div.id = `lbl-${id}`; div.dataset.id = id; div.textContent = text;
        document.getElementById('labels-container').appendChild(div);
    }

    updateHTMLLabels() {
        if (!this.state.showLabels) return;
        const tempV = this._labelVec || (this._labelVec = new THREE.Vector3());
        const updateLabel = (id, mesh) => {
            const element = document.getElementById(`lbl-${id}`);
            if (!element) return;
            mesh.getWorldPosition(tempV); tempV.project(this.camera);
            if (tempV.z > 1) { element.style.opacity = '0'; element.style.pointerEvents = 'none'; return; }
            const x = (tempV.x * .5 + .5) * window.innerWidth;
            const y = (tempV.y * -.5 + .5) * window.innerHeight;
            element.style.left = `${x}px`; element.style.top = `${y - 12}px`;
            element.style.pointerEvents = '';
            element.style.opacity = this.state.targetObject && this.state.targetObject.userData.id !== id && id !== 'sun' ? '0.2' : '1';
        };
        updateLabel('sun', this.sunMesh);
        Object.keys(this.planets).forEach(k => updateLabel(k, this.planets[k].mesh));
    }

    // ------------------------------------------------------------------
    // ETKİLEŞİM
    // ------------------------------------------------------------------
    meshById(id) {
        if (id === 'sun') return this.sunMesh;
        return this.planets[id] ? this.planets[id].mesh : null;
    }

    // Halka veya Ay gibi alt nesnelere tıklanınca sahibi olan gezegeni bul
    pickPlanet(clientX, clientY) {
        this._mouse = this._mouse || new THREE.Vector2();
        this._raycaster = this._raycaster || new THREE.Raycaster();
        this._mouse.x = (clientX / window.innerWidth) * 2 - 1;
        this._mouse.y = -(clientY / window.innerHeight) * 2 + 1;
        this._raycaster.setFromCamera(this._mouse, this.camera);
        const candidates = [this.sunMesh, ...Object.values(this.planets).flatMap(p => p.moon ? [p.mesh, p.moon] : [p.mesh])];
        const hits = this._raycaster.intersectObjects(candidates, true);
        for (const hit of hits) {
            let obj = hit.object;
            if (this.planets.earth && obj === this.planets.earth.moon) return this.planets.earth.mesh;
            while (obj && !(obj.userData && obj.userData.id)) obj = obj.parent;
            if (obj) return obj;
        }
        return null;
    }

    // Sahne ve klavye olayları: sadece bir kez bağlanır
    setupSceneInteractions() {
        let downX = 0, downY = 0;
        window.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });

        window.addEventListener('click', (e) => {
            const label = e.target.closest('.planet-label');
            if (label) { this.selectPlanet(this.meshById(label.dataset.id)); return; }
            if (e.target.closest('.interactive')) return;
            // Kamerayı sürükledikten sonra bırakınca yanlışlıkla seçim yapma
            if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return;
            const mesh = this.pickPlanet(e.clientX, e.clientY);
            if (mesh) this.selectPlanet(mesh);
        });

        // Gezegen üzerine gelince imleci el işaretine çevir
        this.renderer.domElement.addEventListener('pointermove', (e) => {
            if (e.buttons) return;
            this.renderer.domElement.style.cursor = this.pickPlanet(e.clientX, e.clientY) ? 'pointer' : '';
        });

        window.addEventListener('keydown', (e) => {
            if (e.target.closest && e.target.closest('input, textarea, select')) return;
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePause();
            } else if (e.key === 'Escape') {
                this.resetView();
            } else if (/^[0-8]$/.test(e.key)) {
                this.selectPlanet(this.meshById(PLANET_ORDER[Number(e.key)]));
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const cur = this.state.targetObject ? PLANET_ORDER.indexOf(this.state.targetObject.userData.id) : -1;
                const step = e.key === 'ArrowRight' ? 1 : -1;
                const next = cur === -1 ? (step === 1 ? 0 : PLANET_ORDER.length - 1) : (cur + step + PLANET_ORDER.length) % PLANET_ORDER.length;
                this.selectPlanet(this.meshById(PLANET_ORDER[next]));
            }
        });
    }

    // Arayüz düğmeleri: arayüz her yeniden çizildiğinde tekrar bağlanır
    bindUIEvents() {
        const slider = document.getElementById('slider-speed');
        slider.addEventListener('input', (e) => {
            this.state.speedMultiplier = parseFloat(e.target.value);
            document.getElementById('speed-label').textContent = `${UI_TRANSLATIONS[currentLang].orbitSpeed}: ${this.state.speedMultiplier.toFixed(1)}x`;
        });

        document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetView());
        document.getElementById('btn-close-info').addEventListener('click', () => this.resetView());
        document.getElementById('btn-lang').addEventListener('click', () => this.switchLanguage(currentLang === 'tr' ? 'en' : 'tr'));

        document.getElementById('btn-sound').addEventListener('click', (e) => {
            this.state.soundEnabled = !this.state.soundEnabled;
            e.currentTarget.textContent = this.state.soundEnabled ? UI_TRANSLATIONS[currentLang].soundOn : UI_TRANSLATIONS[currentLang].soundOff;
            if (!this.state.soundEnabled) this.stopPlanetSound();
            else if (this.state.targetObject) this.playPlanetSound(this.state.targetObject.userData.id);
        });

        document.getElementById('chk-labels').addEventListener('change', (e) => {
            this.state.showLabels = e.target.checked;
            document.getElementById('labels-container').style.display = e.target.checked ? '' : 'none';
        });
        document.getElementById('chk-orbits').addEventListener('change', (e) => {
            this.state.showOrbits = e.target.checked;
            this.orbitLines.forEach(l => { l.visible = e.target.checked; });
        });

        const planetsGridMenu = document.getElementById('planets-grid-menu');
        document.getElementById('btn-toggle-planets').addEventListener('click', () => planetsGridMenu.classList.toggle('active'));

        document.querySelectorAll('.planet-card').forEach(card => {
            card.addEventListener('click', () => {
                const mesh = this.meshById(card.dataset.id);
                if (mesh) {
                    this.selectPlanet(mesh);
                    planetsGridMenu.classList.remove('active');
                }
            });
        });
    }

    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        const pBtn = document.getElementById('btn-pause');
        if (pBtn) pBtn.textContent = this.state.isPaused ? UI_TRANSLATIONS[currentLang].resume : UI_TRANSLATIONS[currentLang].pause;
    }

    fillInfoPanel(id) {
        const data = PLANET_DATA[id];
        const set = (elId, value) => { document.getElementById(elId).textContent = localized(value); };
        set('info-name', data.name);
        set('info-desc', data.desc);
        set('info-type', data.type);
        set('info-mass', data.mass);
        set('info-period', data.period);
        set('info-rotation', data.rotation);
        set('info-moons', data.moons);
        set('info-tilt', id === 'sun' ? '7.25°' : `${data.tilt}°`);
        set('info-temp', data.temp);
        set('info-colony', data.colony);
        set('info-myth', data.myth);
        set('info-missions', data.missions);

        const progressBar = document.getElementById('compare-bar-fill');
        const progressLabel = document.getElementById('compare-bar-label');
        if (id === 'sun') {
            progressBar.style.width = '100%';
            progressLabel.textContent = UI_TRANSLATIONS[currentLang].sunRatio;
        } else {
            const percent = Math.min((data.earthRatio / 11.2) * 100, 100);
            progressBar.style.width = `${percent}%`;
            progressLabel.textContent = `${data.earthRatio}x ${UI_TRANSLATIONS[currentLang].earthRatio}`;
        }

        document.querySelectorAll('.planet-card').forEach(c => c.classList.toggle('selected', c.dataset.id === id));
    }

    selectPlanet(mesh) {
        if (!mesh) return;
        const id = mesh.userData.id;
        this.state.targetObject = mesh;
        this.state.isTransitioning = true;
        this.state.returningHome = false;
        mesh.getWorldPosition(this.lastTargetPos);

        // Küçük gezegenlere yeterince yaklaşabilmek için minimum mesafeyi gezegene göre ayarla
        this.controls.minDistance = mesh.userData.config.size * 1.5;

        this.playPlanetSound(id);
        this.fillInfoPanel(id);
        document.getElementById('info-panel').classList.add('active');
    }

    resetView() {
        this.stopPlanetSound();
        this.state.targetObject = null;
        this.state.isTransitioning = false;
        this.state.returningHome = true;
        this.controls.minDistance = 10;
        document.getElementById('info-panel').classList.remove('active');
        document.querySelectorAll('.planet-card').forEach(c => c.classList.remove('selected'));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight; this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight); this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    // ------------------------------------------------------------------
    // ANİMASYON
    // ------------------------------------------------------------------
    animate() {
        requestAnimationFrame(() => this.animate());

        // Kare süresine göre ilerle: 60 Hz ve 144 Hz ekranlarda aynı hız
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        const frames = dt * 60;

        if (!this.state.isPaused) {
            const ds = this.state.speedMultiplier * frames;
            this.sunMesh.rotation.y += PLANET_DATA.sun.rotSpeed * ds;
            Object.keys(this.planets).forEach((k) => {
                const p = this.planets[k];
                p.angle += p.speed * 0.2 * ds;
                p.holder.position.set(Math.cos(p.angle) * PLANET_DATA[k].dist, 0, Math.sin(p.angle) * PLANET_DATA[k].dist);
                p.mesh.rotation.y += p.rotSpeed * ds;
                if (p.moon) {
                    p.moonAngle += 0.05 * ds;
                    p.moon.position.set(Math.cos(p.moonAngle) * MOON_DISTANCE, 0, Math.sin(p.moonAngle) * MOON_DISTANCE);
                }
            });
            if (this.asteroidBelt) this.asteroidBelt.rotation.y += 0.0003 * ds;
        }

        const k = 1 - Math.pow(0.95, frames); // kare hızından bağımsız yumuşatma

        if (this.state.targetObject) {
            const tPos = this._tPos || (this._tPos = new THREE.Vector3());
            this.state.targetObject.getWorldPosition(tPos);

            // Gezegen ne kadar kaydıysa kamerayı da o kadar kaydır: gezegen ekranda sabit kalır,
            // kullanıcı etrafında serbestçe dönebilir / yakınlaşabilir.
            const delta = tPos.clone().sub(this.lastTargetPos);
            this.camera.position.add(delta);
            this.controls.target.add(delta);
            this.lastTargetPos.copy(tPos);

            if (this.state.isTransitioning) {
                const r = this.state.targetObject.userData.config.size;
                const dest = tPos.clone().add(new THREE.Vector3(0, r * 2.5, r * 4));
                this.controls.target.lerp(tPos, k);
                this.camera.position.lerp(dest, k);
                if (this.camera.position.distanceTo(dest) < 0.3 && this.controls.target.distanceTo(tPos) < 0.1) {
                    this.controls.target.copy(tPos);
                    this.state.isTransitioning = false;
                }
            }
        } else if (this.state.returningHome) {
            this.camera.position.lerp(HOME_POSITION, k);
            this.controls.target.lerp(new THREE.Vector3(0, 0, 0), k);
            if (this.camera.position.distanceTo(HOME_POSITION) < 1) this.state.returningHome = false;
        }

        this.controls.update(); this.updateHTMLLabels(); this.composer.render();
    }

    // ------------------------------------------------------------------
    // ARAYÜZ
    // ------------------------------------------------------------------
    buildUI() {
        const oldUI = document.getElementById('ui-container'); if (oldUI) oldUI.remove();
        if (!document.getElementById('labels-container')) {
            const lc = document.createElement('div'); lc.id = 'labels-container'; document.body.appendChild(lc);
        }
        if (!document.getElementById('canvas-container')) {
            const cc = document.createElement('div'); cc.id = 'canvas-container'; document.body.appendChild(cc);
        }

        const t = UI_TRANSLATIONS[currentLang];
        const selectedId = this.state.targetObject ? this.state.targetObject.userData.id : null;
        const hex = (c) => c.toString(16).padStart(6, '0');

        const ui = document.createElement('div'); ui.id = 'ui-container';
        ui.innerHTML = `
            <header class="interactive">
                <h1>${t.title}</h1>
                <div class="header-actions">
                    <button id="btn-lang" class="btn">${t.langBtn}</button>
                    <button id="btn-reset" class="btn">${t.resetView}</button>
                </div>
            </header>

            <div class="left-column">
                <div class="panel controls-panel interactive">
                    <div class="slider-container">
                        <label id="speed-label" for="slider-speed">${t.orbitSpeed}: ${this.state.speedMultiplier.toFixed(1)}x</label>
                        <input type="range" id="slider-speed" min="0" max="5" step="0.1" value="${this.state.speedMultiplier}">
                    </div>
                    <button id="btn-pause" class="btn">${this.state.isPaused ? t.resume : t.pause}</button>
                    <button id="btn-sound" class="btn">${this.state.soundEnabled ? t.soundOn : t.soundOff}</button>
                    <div class="toggles">
                        <label><input type="checkbox" id="chk-labels" ${this.state.showLabels ? 'checked' : ''}> ${t.labels}</label>
                        <label><input type="checkbox" id="chk-orbits" ${this.state.showOrbits ? 'checked' : ''}> ${t.orbits}</label>
                    </div>
                    <button id="btn-toggle-planets" class="btn btn-accent">${t.planetsMenuBtn}</button>
                </div>

                <div id="planets-grid-menu" class="panel">
                    ${PLANET_ORDER.map((key, i) => {
                        const p = PLANET_DATA[key];
                        return `
                            <div class="planet-card${key === selectedId ? ' selected' : ''}" data-id="${key}">
                                <div class="planet-thumb" style="background-image: url('${p.menuImg}'); border: 1px solid #${hex(p.color)}80; box-shadow: 0 0 5px #${hex(p.color)}50;"></div>
                                <span>${p.name[currentLang]}</span>
                                <kbd>${i}</kbd>
                            </div>`;
                    }).join('')}
                </div>
            </div>

            <div id="info-panel" class="panel info-panel interactive">
                <button id="btn-close-info" class="btn-close" aria-label="Close">✕</button>
                <h2 id="info-name">-</h2>
                <p id="info-desc"></p>

                <h3 class="section-title">${t.physAttrs}</h3>
                <div class="info-grid">
                    <div class="info-label">${t.type}</div><div id="info-type">-</div>
                    <div class="info-label">${t.mass}</div><div id="info-mass">-</div>
                    <div class="info-label">${t.period}</div><div id="info-period">-</div>
                    <div class="info-label">${t.rotation}</div><div id="info-rotation">-</div>
                    <div class="info-label">${t.tilt}</div><div id="info-tilt">-</div>
                    <div class="info-label">${t.moons}</div><div id="info-moons">-</div>
                </div>

                <h3 class="section-title">${t.envHab}</h3>
                <div class="info-grid">
                    <div class="info-label">${t.temp}</div><div id="info-temp">-</div>
                    <div class="info-label">${t.colony}</div><div id="info-colony" style="color: #00ffcc;">-</div>
                </div>

                <h3 class="section-title">${t.history}</h3>
                <div id="info-myth" class="full-width-text">-</div>

                <h3 class="section-title">${t.missions}</h3>
                <div id="info-missions" class="full-width-text" style="color: #ffaa00; font-family: monospace;">-</div>

                <h3 class="section-title">${t.scale}</h3>
                <div class="compare-container">
                    <div class="compare-bar"><div id="compare-bar-fill"></div></div>
                    <span id="compare-bar-label">-</span>
                </div>
            </div>

            <div class="hint">${t.hint}</div>`;
        document.body.appendChild(ui);

        if (document.getElementById('app-dynamic-styles')) return;
        const style = document.createElement('style');
        style.id = 'app-dynamic-styles';
        style.textContent = `
            body { color:#fff; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; user-select:none; }
            #ui-container { position:absolute; inset:0; z-index:10; pointer-events:none; display:grid; grid-template-columns:300px 1fr 380px; grid-template-rows:60px 1fr; padding:20px; box-sizing:border-box; }
            .interactive { pointer-events:auto; }
            header { grid-column:1/-1; display:flex; justify-content:space-between; align-items:center; align-self:start; }
            .header-actions { display:flex; gap:8px; }
            h1 { margin:0; font-size:20px; letter-spacing:2px; text-transform:uppercase; color:#e0f7fa; text-shadow:0 0 10px rgba(0,255,255,0.5); }
            .panel { background:rgba(5,15,25,0.85); border:1px solid rgba(0,150,255,0.3); border-radius:8px; padding:20px; backdrop-filter:blur(10px); box-shadow:0 0 20px rgba(0,0,0,0.5); box-sizing:border-box; }

            .left-column { grid-column:1; grid-row:2; display:flex; flex-direction:column; gap:12px; align-self:start; min-height:0; max-height:100%; }
            .controls-panel { display:flex; flex-direction:column; gap:12px; }
            .toggles { display:flex; gap:16px; font-size:12px; color:#cfe8ff; }
            .toggles label { display:flex; align-items:center; gap:6px; cursor:pointer; }
            .toggles input { accent-color:#00d2ff; cursor:pointer; }

            #planets-grid-menu { display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; padding:12px; overflow-y:auto; min-height:0;
                opacity:0; transform:translateY(20px); transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events:none; }
            #planets-grid-menu.active { opacity:1; transform:translateY(0); pointer-events:auto; }
            .planet-card { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.05); padding:6px; border-radius:6px; cursor:pointer;
                transition:background 0.2s, transform 0.2s; border:1px solid rgba(255,255,255,0.03); }
            .planet-card:hover { background:rgba(0,210,255,0.15); transform:scale(1.03); border-color:rgba(0,210,255,0.4); }
            .planet-card.selected { background:rgba(0,210,255,0.22); border-color:#00d2ff; }
            .planet-card span { color:#fff; font-size:12px; font-weight:500; flex:1; }
            .planet-card kbd { font-size:10px; color:#8ab4f8; border:1px solid rgba(138,180,248,0.4); border-radius:3px; padding:0 4px; font-family:monospace; }
            .planet-thumb { width:25px; height:25px; border-radius:50%; flex-shrink:0; background-size:cover; background-position:center; background-repeat:no-repeat; }

            .info-panel { grid-column:3; grid-row:2; align-self:start; opacity:0; transform:translateX(50px); transition:all 0.5s ease; max-height:calc(100vh - 120px); overflow-y:auto; color:#e0e0e0; pointer-events:none; }
            .info-panel.active { opacity:1; transform:translateX(0); pointer-events:auto; }
            .info-panel h2 { margin-top:0; color:#00d2ff; border-bottom:1px solid rgba(0,210,255,0.3); padding-bottom:5px; font-size:24px; letter-spacing:1px; }
            .section-title { font-size:13px; text-transform:uppercase; color:#0096ff; margin:15px 0 8px 0; letter-spacing:1px; border-bottom:1px dashed rgba(0,150,255,0.2); padding-bottom:2px; }
            .info-grid { display:grid; grid-template-columns:auto 1fr; gap:8px 12px; font-size:13px; line-height:1.4; }
            .info-label { color:#8ab4f8; font-weight:bold; }
            .full-width-text { font-size:13px; line-height:1.5; color:#d1d1d1; }
            .compare-container { display:flex; flex-direction:column; gap:4px; font-size:11px; color:#8ab4f8; font-family:monospace; }
            .compare-bar { width:100%; height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; border:1px solid rgba(0,150,255,0.2); }
            #compare-bar-fill { height:100%; width:0%; background:linear-gradient(90deg, #0055ff, #00d2ff); transition:width 0.6s ease-in-out; box-shadow:0 0 8px #00d2ff; }

            .btn { background:rgba(0,150,255,0.2); border:1px solid #0096ff; color:#fff; padding:8px 16px; border-radius:4px; cursor:pointer; text-transform:uppercase; font-size:12px; transition:all 0.2s; }
            .btn:hover { background:rgba(0,150,255,0.5); box-shadow:0 0 10px #0096ff; }
            .btn-accent { background:rgba(0,210,255,0.2); border-color:#00d2ff; font-weight:bold; }
            .slider-container { display:flex; flex-direction:column; gap:5px; }
            #speed-label { color:#fff; font-size:13px; }
            input[type=range] { width:100%; -webkit-appearance:none; appearance:none; background:rgba(255,255,255,0.1); height:6px; border-radius:5px; }
            input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; height:16px; width:16px; border-radius:50%; background:#00d2ff; cursor:pointer; }
            input[type=range]::-moz-range-thumb { height:16px; width:16px; border:none; border-radius:50%; background:#00d2ff; cursor:pointer; }
            .btn-close { float:right; background:none; border:none; color:#ff4a4a; cursor:pointer; font-size:16px; }

            .planet-label { position:absolute; z-index:5; transform:translate(-50%,-100%); color:rgba(255,255,255,0.8); font-family:monospace; font-size:11px; cursor:pointer;
                background:rgba(0,0,0,0.6); padding:2px 6px; border-radius:3px; border:1px solid rgba(255,255,255,0.2); transition:border-color 0.2s, color 0.2s; }
            .planet-label:hover { color:#fff; border-color:#00d2ff; }

            .hint { position:absolute; left:20px; bottom:14px; font-size:11px; color:rgba(255,255,255,0.45); font-family:monospace; }

            .info-panel::-webkit-scrollbar, #planets-grid-menu::-webkit-scrollbar { width:4px; }
            .info-panel::-webkit-scrollbar-track, #planets-grid-menu::-webkit-scrollbar-track { background:rgba(0,0,0,0.1); }
            .info-panel::-webkit-scrollbar-thumb, #planets-grid-menu::-webkit-scrollbar-thumb { background:rgba(0,150,255,0.4); border-radius:2px; }

            /* Telefon / dar ekran */
            @media (max-width: 820px) {
                #ui-container { grid-template-columns:1fr; grid-template-rows:auto 1fr; padding:12px; }
                h1 { font-size:15px; letter-spacing:1px; }
                .btn { padding:6px 10px; font-size:11px; }
                .left-column { grid-column:1; max-width:260px; }
                .panel { padding:12px; }
                .hint { display:none; }
                .info-panel { position:fixed; left:12px; right:12px; bottom:12px; max-height:45vh; transform:translateY(40px); }
                .info-panel.active { transform:translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}
