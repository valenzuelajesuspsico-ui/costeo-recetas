// Construye la app (../index.html) y su service worker (../sw.js) a partir de los archivos de esta carpeta.
// Uso:  node fuente/build.js            → genera index.html y sw.js
//       node fuente/build.js --precios  → imprime la lista de precios vigente (JSON) y no escribe nada
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const AQUI=p=>path.join(__dirname,p);
const SOLO_PRECIOS=process.argv.includes("--precios");
const log=SOLO_PRECIOS?()=>{}:console.log;
const BASE=JSON.parse(JSON.stringify(require("./base.js")));
const X=require("./libro/extra.js"),Y=require("./libro/extra2.js");
BASE.LIBROS={...X.LIBROS,...Y.LIBROS};
const have=new Set(BASE.PRECIOS.map(p=>p[0].toLowerCase()));
for(const p of [...X.PRECIOS_EXTRA,...Y.PRECIOS_EXTRA])if(!have.has(p[0].toLowerCase())){BASE.PRECIOS.push(p);have.add(p[0].toLowerCase())}
for(const d of BASE.RECETAS)if(X.CONSEJOS[d.n])d.c=X.CONSEJOS[d.n];
BASE.RECETAS.push(...X.RECETAS_LIBRO);
const TR=require("./libro/tradicionales.js");Object.assign(BASE.LIBROS,TR.FUENTES);BASE.PRECIOS.push(...TR.PRECIOS);BASE.RECETAS.push(...TR.RECETAS.map(r=>({...r})));
const PASOS=require("./libro/pasos.js");let sinP=[];for(const d of BASE.RECETAS){if(PASOS[d.n])d.s=PASOS[d.n];else if(!d.s)sinP.push(d.n)}log("sin pasos (propias/Bressanini):",sinP);const usados=new Set(BASE.RECETAS.map(d=>d.n));log("pasos sin receta:",Object.keys(PASOS).filter(k=>!usados.has(k)));
// Vegetable Simple
const tc=s=>s.split(" ").map((w,i)=>i&&["De","Y","Con","A","Al","La","El","En","Los","Las","Del","Au","Estilo"].includes(w)?w.toLowerCase():w).join(" ");
const veg=JSON.parse(fs.readFileSync(AQUI("libro/veg_recetas.json"),"utf8"));
// ripert_pasos.js: las 25 recetas más sencillas del libro, revisadas a mano (ingredientes, descripción, pasos y consejos)
const RP=require("./libro/ripert_pasos.js");const rpUsadas=new Set();
let nv=0;
for(const r of veg){
  if(Y.OMITIR.includes(r.n))continue;
  const o=RP[r.p];if(o)rpUsadas.add(String(r.p));
  r.n=o?o.n:(Y.TITULOS[r.n]||tc(r.n));
  const ejote=/ejote/i.test(r.n);
  r.i=r.i.map(([n,q,u])=>{let nn=Y.NOMBRES.hasOwnProperty(n)?Y.NOMBRES[n]:n;if(nn===null)return null;if(ejote&&nn==="Frijol")nn="Ejote";if(n==="Jugo de limón"||n==="Jugo de lima"){q=q*2;u="g"}if(nn==="Anís estrella"){u="g"}if(nn==="Zacate limón"){u="pza";q=Math.max(0.05,q)}return[nn,q,u]}).filter(Boolean);
  r.i=r.i.filter(([n])=>n&&/^[A-ZÁÉÍÓÚÑ]/.test(n)&&n.length>2);
  if(o){r.i=o.i.map(x=>[...x]);r.d=o.d;r.s=[...o.s];r.r=o.r;r.niv=o.niv;r.min=o.min;r.al=[...o.al];r.mo=[...o.mo];if(o.t)r.t=o.t}
  r.k="ripert verduras vegetariano "+r.n.toLowerCase();
  r.c=o?[...o.c]:[...(Y.TIPS_RIPERT[r.t]||Y.TIPS_RIPERT.Verduras)];
  delete r.serv;BASE.RECETAS.push(r);nv++;
}
{const f=Object.keys(RP).filter(k=>!rpUsadas.has(k));if(f.length)throw new Error("ripert_pasos.js: páginas sin receta: "+f.join(", "))}
// Descripciones más claras (libro/descripciones.js) para saber de qué trata cada platillo antes de abrirlo
{const DE=require("./libro/descripciones.js"),porN=new Map(BASE.RECETAS.map(d=>[d.n,d]));for(const [k,v] of Object.entries(DE)){const d=porN.get(k);if(!d)throw new Error("descripciones.js: no existe la receta «"+k+"»");d.d=v}}
// Clasificación para «¿Qué cocinar hoy?»: nivel, minutos, tipo de alimento y momento del día.
// Solo se sugieren las recetas clasificadas (las nuevas la traen consigo; las anteriores están en libro/clasif.js).
const AL=["pollo","res","cerdo","pescado","verduras","huevo","frijol","arroz","maiz","postres","salsas","bebidas"],MO=["d","c","n"];
{const CL=require("./libro/clasif.js"),vistos=new Set(),err=[];
 for(const d of BASE.RECETAS){const c=CL[d.n];if(c&&!d.niv){const [v,m,a,o]=c.split("|");d.niv=+v;d.min=+m;d.al=a?a.split(","):[];d.mo=o?o.split(","):[];vistos.add(d.n)}}
 for(const k of Object.keys(CL))if(!vistos.has(k))err.push("clasif.js: no existe la receta «"+k+"» (o ya trae su clasificación)");
 const nombres=new Set();
 for(const d of BASE.RECETAS){if(nombres.has(d.n.toLowerCase()))err.push("nombre repetido: "+d.n);nombres.add(d.n.toLowerCase());if(!d.niv)continue;
  if(![1,2,3].includes(d.niv))err.push(d.n+": nivel inválido");if(!(d.min>0))err.push(d.n+": minutos inválidos");
  if(!(d.s&&d.s.length))err.push(d.n+": clasificada pero sin pasos");if((d.d||"").trim().length<60)err.push(d.n+": clasificada pero con descripción muy corta");
  for(const a of d.al)if(!AL.includes(a))err.push(d.n+": alimento desconocido «"+a+"»");
  if(!d.mo.length)err.push(d.n+": sin momento del día");for(const m of d.mo)if(!MO.includes(m))err.push(d.n+": momento desconocido «"+m+"»");
  for(const p of d.s)if(!/^[^:]{2,45}: \S/.test(p))err.push(d.n+": paso sin «Título: detalle» → "+p.slice(0,40))}
 if(err.length)throw new Error("Clasificación:\n - "+err.join("\n - "));
 const sug=BASE.RECETAS.filter(d=>d.niv);
 log("¿Qué cocinar hoy?: "+sug.length+" recetas sugeribles. Por botón (básicas/intermedias/elaboradas · desayuno/comida/cena):");
 for(const a of AL){const g=sug.filter(d=>d.al.includes(a));log("   "+a.padEnd(9)+String(g.length).padStart(3)+"  "+[1,2,3].map(v=>g.filter(d=>d.niv===v).length).join("/")+"  ·  "+MO.map(m=>g.filter(d=>d.mo.includes(m)).length).join("/"))}
 log("con pasos pero sin clasificar (no se sugieren):",BASE.RECETAS.filter(d=>d.s&&d.s.length&&!d.niv).map(d=>d.n));
}
// Coerción de unidades al precio
const PESO={"Laurel":0.3,"Queso de cabra":100,"Frijol":1,"Perejil":50,"Cilantro":50,"Hierbabuena":50,"Albahaca":50,"Romero":30,"Tomillo":30,"Lechuga romana":400,"Espinaca":250,"Rábano":15,"Elote":150,"Baguette":250,"Flor de calabaza":80,"Epazote":50,"Salvia fresca":40,"Cebolla cambray":15,"Zacate limón":40,"Piña":1200,"Coco":600,"Huevo":50,"Vaina de vainilla":3,"Limón":60,"Té (caja)":50};
for(const d of BASE.RECETAS)d.i=d.i.map(([n,q,u])=>{const p=BASE.PRECIOS.find(p=>p[0].toLowerCase()==n.toLowerCase());if(!p)return[n,q,u];const por={g:"kg",kg:"kg",ml:"L",L:"L",pza:"pza"}[u];if(p[2]===por)return[n,q,u];const w=PESO[n]||50;
  if(p[2]==="kg"&&u==="ml")return[n,q,"g"];if(p[2]==="L"&&u==="g")return[n,q,"ml"];if(p[2]==="kg"&&u==="pza")return[n,+(q*w).toFixed(2),"g"];if(p[2]==="pza"&&(u==="g"||u==="ml"))return[n,+(q/w).toFixed(2),"pza"];if(p[2]==="L"&&u==="pza")return[n,+(q*w).toFixed(2),"ml"];return[n,q,u]});
// Consejos de Cocinología para todas las recetas
for(const d of BASE.RECETAS){
  const text=d.n;const temas=[];
  for(const [re,k] of Y.TIPS_COCI_KEYS)if(re.test(text)&&!temas.includes(k))temas.push(k);
  const tips=[];for(const k of temas.slice(0,1))tips.push(Y.TIPS_COCI[k][0]);
  d.c=[...(d.c||[]),...tips];
}
// Maridajes (Segnit)
const M=JSON.parse(fs.readFileSync(AQUI("libro/maridajes.json"),"utf8")).map(([a,b,p])=>[a==="Ahnendra"?"Almendra":a==="Tornillo"?"Tomillo":a,b==="Ahnendra"?"Almendra":b==="Tornillo"?"Tomillo":b,p]);
BASE.MARIDAJES=M;BASE.SINONIMOS_MX=Y.SINONIMOS_MX;
// Región de las recetas tradicionales (para el filtro de la biblioteca)
const REG=[["norte","Norte"],["occidente","Occidente y Bajío"],["centro","Centro"],["golfo","Golfo"],["sur","Sur"],["península","Península de Yucatán"]];
const REG_PRIMERAS={"Tinga de cerdo con chorizo y chipotle":"Centro","Sopa de lima":"Península de Yucatán","Caldo tlalpeño":"Centro","Mole de olla":"Centro","Frijoles charros":"Norte","Capirotada":"Occidente y Bajío","Albóndigas en chipotle":"Centro","Champurrado":"Centro"};
for(const d of BASE.RECETAS){const m=/región ([a-zñáéíóú]+)/.exec(d.k||"");const r=m&&REG.find(x=>x[0]===m[1]);if(r)d.g=r[1];else if(REG_PRIMERAS[d.n]&&d.f)d.g=REG_PRIMERAS[d.n]}
BASE.REGIONES=REG.map(x=>x[1]);
// Precios actualizados cada semana: precios.json manda sobre los precios escritos en base.js y libro/*.js.
// En precios.json los ingredientes se escriben con el mismo nombre que en la lista (da igual mayúsculas o acentos).
const nrm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
const PJ=JSON.parse(fs.readFileSync(AQUI("precios.json"),"utf8"));
if(PJ.FECHA)BASE.FECHA=PJ.FECHA;
const porNombre=new Map(BASE.PRECIOS.map(p=>[nrm(p[0]),p]));const avisos=[];
for(const [k,v] of Object.entries(PJ.PRECIOS||{})){const p=porNombre.get(nrm(k));if(!p)avisos.push("PRECIOS: no existe «"+k+"»");else if(typeof v!=="number"||!(v>=0))avisos.push("PRECIOS: precio inválido en «"+k+"»");else p[1]=v}
const TIENDAS_UNA=["calimax","soriana","ley","walmart","costco","smart","mercado"];BASE.PRECIOS_TIENDA={};
for(const [t,lista] of Object.entries(PJ.PRECIOS_TIENDA||{})){if(!TIENDAS_UNA.includes(t)){avisos.push("PRECIOS_TIENDA: tienda desconocida «"+t+"»");continue}
  for(const [k,v] of Object.entries(lista||{})){if(!porNombre.has(nrm(k)))avisos.push("PRECIOS_TIENDA."+t+": no existe «"+k+"»");else if(typeof v!=="number"||!(v>=0))avisos.push("PRECIOS_TIENDA."+t+": precio inválido en «"+k+"»");else(BASE.PRECIOS_TIENDA[t]=BASE.PRECIOS_TIENDA[t]||{})[nrm(k)]=v}}
if(avisos.length){console.error("AVISOS de precios.json (esas entradas se ignoran):\n - "+avisos.join("\n - "))}
if(SOLO_PRECIOS){console.log(JSON.stringify({FECHA:BASE.FECHA,PRECIOS:BASE.PRECIOS.map(([nombre,precio,unidad,tienda])=>({nombre,precio,unidad,tienda})),PRECIOS_TIENDA:PJ.PRECIOS_TIENDA||{}},null,1));process.exit(0)}
// Verificación de precios
const ref=new Set(BASE.PRECIOS.map(p=>p[0].toLowerCase()));const miss={};let unitErr=[];
for(const d of BASE.RECETAS)for(const [n,q,u] of d.i){const p=BASE.PRECIOS.find(p=>p[0].toLowerCase()==n.toLowerCase());if(!p){miss[n]=(miss[n]||0)+1}else{const por={g:"kg",kg:"kg",ml:"L",L:"L",pza:"pza"}[u];if(p[2]!==por)unitErr.push(d.n+": "+n+" "+u+"≠"+p[2])}}
log("sin precio:",Object.entries(miss).sort((a,b)=>b[1]-a[1]).slice(0,40));log("unidad:",unitErr.slice(0,30),unitErr.length);
const ids=["01","02","03","04","05","06","07","08"];
const recetas=ids.map(k=>{const d=JSON.parse(fs.readFileSync(AQUI("seed/tym-"+k+".json"),"utf8"));d.id="tym-"+k;d.ingredientes=d.ingredientes.map(r=>({nombre:r.nombre,cantidad:r.cantidad,unidad:r.unidad,precio:r.precio,precioPor:r.precioPor,fuente:"recetario",tienda:"",dir:""}));return d});
const J=o=>JSON.stringify(o).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
let html=fs.readFileSync(AQUI("plantilla.html"),"utf8").replace("__BASE__",()=>J(BASE)).replace("__SEED__",()=>J(recetas)).replace("__LOGO__",()=>fs.readFileSync(AQUI("logo/logo.b64"),"utf8").trim());
if(/__BASE__|__SEED__|__LOGO__/.test(html))throw new Error("Quedó un marcador sin reemplazar en la plantilla");
fs.writeFileSync(AQUI("../index.html"),html);
// Service worker: su versión cambia sola cuando cambia la app
const ver=crypto.createHash("sha1").update(html).digest("hex").slice(0,10);
fs.writeFileSync(AQUI("../sw.js"),fs.readFileSync(AQUI("sw.plantilla.js"),"utf8").replace("__VERSION__",ver));
log("recetas:",BASE.RECETAS.length,"(veg",nv,") precios:",BASE.PRECIOS.length,"maridajes:",M.length,"bytes:",html.length,"versión:",ver);
