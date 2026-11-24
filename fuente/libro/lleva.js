// «Lleva: …» — los ingredientes que mejor describen un platillo, en palabras llanas, para las tarjetas de ideas.
// Se calcula solo: se toman los ingredientes por peso, dando más importancia a lo que define el platillo
// (carnes, pescados, huevo, quesos, legumbres, chiles secos…) y dejando fuera sal, aceites y condimentos menudos.
const norm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").trim().toLowerCase();

// No se mencionan
const FUERA=/^(sal|aceite .*|consome de pollo en polvo|pimienta .*|laurel|oregano|comino|tomillo|mejorana|bicarbonato|polvo para hornear|vinagre .*|hielo|fecula de maiz|clavo|nuez moscada|huesos de res|manteca de cerdo|hoja para tamal|hoja de platano|extracto de vainilla|salsa inglesa|salsa de soya|mostaza.*|azucar|harina de trigo)$/;
// …salvo en postres y bebidas, donde azúcar, harina, mantequilla o limón sí son lo principal
const FUERA_DULCE=/^(sal|aceite .*|bicarbonato|polvo para hornear|hielo|fecula de maiz|clavo|nuez moscada|extracto de vainilla)$/;

// Importancia: [expresión, factor]
const PESA=[
 [/manteca|consome|huesos/,1],
 [/pollo|pavo|\bres\b|bistec|diezmillo|chambarete|arrachera|machaca|cerdo|borrego|carnitas|cecina|chicharron|camaron|pescado|pulpo|salmon|atun|cazon|mojarra|jaiba|espinazo|salchicha/,4],
 [/huevo|frijol|lenteja|garbanzo|haba/,3],
 [/chorizo|tocino|jamon/,1.5],
 [/chile (guajillo|ancho|pasilla|morita|de arbol|piquin)|chipotle|mole en pasta|achiote|chocolate|cacao|flor de jamaica|tamarindo|pinole|amaranto|cajeta|pepita|cacahuate|ajonjoli|almendra|nuez\b/,6],
 [/tortilla|tostadas|totopos|bolillo|baguette|pan /,1.2],
 [/queso|requeson|ricotta|mozzarella|arroz|pasta|masa de maiz|maiz pozolero/,2],
 [/chile (poblano|serrano|jalapeno|habanero|guero|chilaca)|piloncillo|leche condensada|leche evaporada|canela/,2]
];

// Nombres llanos
const LLANO=[
 [/^(pechuga de pollo|muslo con pierna de pollo|pollo entero)$/,"pollo"],
 [/^carne molida de res$/,"carne molida de res"],[/^carne molida de cerdo$/,"carne molida de cerdo"],
 [/^bistec de res$/,"bistec"],[/^(diezmillo|chambarete|falda de res|pecho de res|filete de res|arrachera)$/,"carne de res"],
 [/^costilla cargada de res$/,"costilla de res"],
 [/^(espaldilla de cerdo sin hueso|pierna de cerdo|lomo de cerdo|espinazo de cerdo)$/,"carne de cerdo"],
 [/^filete de pescado$/,"pescado"],[/^pescado entero.*$/,"pescado entero"],[/^mojarra entera$/,"mojarra"],[/^atun en lata$/,"atún"],
 [/^tortilla de maiz$/,"tortillas"],[/^tortilla de harina$/,"tortillas de harina"],[/^harina de trigo$/,"harina"],
 [/^queso chihuahua o manchego$/,"queso manchego"],[/^crema para batir o media crema$/,"crema"],[/^leche entera$/,"leche"],
 [/^(chipotle adobado|chipotle seco)$/,"chipotle"],[/^pasta seca$/,"pasta"],
 [/^cebolla blanca$/,"cebolla"],[/^camote naranja$/,"camote"],[/^calabaza de castilla$/,"calabaza"],[/^lechuga romana$/,"lechuga"],
 [/^pimiento morron$/,"pimiento"],[/^pepita de calabaza pelada$/,"pepita"],[/^flor de jamaica$/,"jamaica"],[/^chocolate de mesa$/,"chocolate"],
 [/^galleta maria$/,"galletas María"],[/^mole en pasta$/,"mole"],[/^achiote en pasta$/,"achiote"],[/^mayonesa comercial$/,"mayonesa"],
 [/^licor para cocinar$/,"licor"],[/^champinon$/,"champiñones"],[/^nopal$/,"nopales"],[/^ejote$/,"ejotes"],[/^chicharo$/,"chícharos"],
 [/^frijol$/,"frijoles"],[/^lenteja$/,"lentejas"],[/^garbanzo$/,"garbanzos"],[/^calabacita$/,"calabacitas"],[/^haba seca pelada$/,"habas"],
 [/^haba fresca$/,"habas"],[/^huitlacoche fresco$/,"huitlacoche"],[/^chile piquin molido$/,"chile piquín"],[/^canela en raja$/,"canela"],
 [/^canela molida$/,"canela"],[/^datil sin hueso$/,"dátil"],[/^salsa sriracha$/,"salsa Sriracha"],[/^vaina de vainilla$/,"vainilla"],
 [/^rabano con hojas.*$/,"rábanos"],[/^rabano$/,"rábano"],[/^hoja santa$/,"hoja santa"],[/^platano macho$/,"plátano macho"],
 [/^cana de azucar$/,"caña"],[/^ciruela pasa$/,"ciruela pasa"],[/^cebolla cambray$/,"cebollitas"],[/^zacate limon$/,"té limón"]
];
const llano=n=>{n=n.replace(/\s*\([^)]*\)/g,"").trim();const k=norm(n);for(const [re,t] of LLANO)if(re.test(k))return t;return n.charAt(0).toLowerCase()+n.slice(1)};

module.exports=function lleva(d,PESO,max=5,todo=false){
  const dulce=todo||d.t==="Postre"||d.t==="Bebida",fuera=dulce?FUERA_DULCE:FUERA,pts=new Map();
  for(const [n,q,u] of d.i){
    const k=norm(n);if(fuera.test(k))continue;
    const g=u==="kg"||u==="L"?q*1000:u==="pza"?q*(PESO[n]||100):q;
    let f=1;for(const [re,x] of PESA)if(re.test(k)){f=x;break}
    const t=llano(n);pts.set(t,(pts.get(t)||0)+g*f);
  }
  const top=[...pts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,max).map(x=>x[0]);
  if(!top.length)return todo?"":module.exports(d,PESO,max,true); // si todo quedó fuera (p. ej. tortillas de harina), se menciona lo que hay
  return top.length===1?top[0]:top.slice(0,-1).join(", ")+" y "+top[top.length-1];
};
