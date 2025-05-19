// Avec une constante, tous les passages possèderaient la même instance de TAGS
// Changer un tag d'un passage viendrait à changer tous les autres
// const TAGS = {"biomes":"", "personnages":"", "actions":""}
let cy_graph = null
let LAST_DEFAULT_TAG = 31  //the number of default columns
const BIOMES = []
SORTIES_INV = ["x","v","p","r"]
let CSV_OBJ = {}
let OBJ_TEST

class passageTag{
  constructor({height, width}={}) {
    this.height = height;
    this.width = width;
  }
}

class Data{
  /**
   * A class used in the optic of grouping all informations needed for treating the
   * Interactive Fiction and displaying the corresponding graph
   * @param {Object} param0
   * @param {String} param1
   * @param {Blob} param2
   * @param {String} param3
   * @param {Blob} param4
   */
  constructor({working_data={}, entry_pdf_name="", PDF=Blob, entry_csv_name="", CSV=Blob}={}){
    this.working_data = working_data
    this.entry_pdf_name = entry_pdf_name
    this.PDF = PDF
    this.entry_csv_name = entry_csv_name
    this.CSV = CSV
  }

  /**
   * Used for editing a certain part of the working_data dict
   * @param {String} target 
   * @param {String} variable 
   * @param {String} value 
   * @param {Boolean} flood 
   */
  edit(target, variable, value, flood=false){
    if(flood){
      this.working_data[target]["tags"][variable]["value"] = value
      this.working_data[target]["tags"][variable]["entry"] = true
    }else{
      this.working_data[target]["sorties"][variable] = value
    }
  }

  /**
   * Change a CSV (string) into a data set (dictionnary) usable by Ficus
   * @param {String} text_csv 
   * @returns {Object}
   */
  importCSV(text_csv){
    let papa_results = ""
    Papa.parse(text_csv, {
      header:true,
      skipEmptyLines: true, // Ignorer les lignes vides
      complete: (results) => {
        papa_results = results.data; // Afficher les données
      },
      error: (err) => {
        console.error('Erreur lors du parsing du CSV:', err);
      },
    });

    let results = {}
    let lastValidId = null

    for (let i = 0; i < papa_results.length; i++) {
      let obj = papa_results[i]
      const id = obj.numero_passage || lastValidId

      if (!results[id]){
        results[id] = {
          text: "",
          to: [],
          from: [],
          tags: { biomes: {}, personnages: {}, actions: {} }
        };
      }
      let newExit = {}
      if(obj.numero_passage){
        lastValidId = obj.numero_passage
        // let added_tags = {"biomes":"", "personnages":"", "actions":""}
        for(let [key, value] of Object.entries(obj)){
          // Skip la première colonne (numero_passage)
          if (key === Object.keys(obj)[0]) continue;
          //récupère les tags des passages...
          if(key.includes("ficusTag_")){
            let cleanTagName = key.replace("ficusTag_", "")
            results[id].tags[cleanTagName] = {"value" : value, "entry" : Boolean(value)}
          }else{
            //... et ceux des sorties
            newExit[key] = value
          }
        }
        results[id]["to"].push(newExit)
      }else{
        for(let [key, value] of Object.entries(obj)){
          // Skip la première colonne (numero_passage)
          if (key === Object.keys(obj)[0]) continue;
          //récupère les tags des sorties uniquement (pas de tags de passage)
          if(!key.includes("ficusTag_")){
            newExit[key] = value
          }
        }
        results[id]["to"].push(newExit)
      }
    }
    console.log(results)
    this.working_data = results
    return results;
  }

  /**
   * Import text from a PDF and slice it by chapter, then add each chapter's text to its corresponding node in working_data
   * @returns 
   */
  async importPDF(){
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(this.PDF)).promise;
    let bookString=""
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // reconstruction des retours à la ligne
      let pageText = "";
      let lastY = null;
      
      // Les pdfs contiennent des items dont la propriété .transform renvoie une matrice PDF Matrix :
      // l'index 5 est la position sur l'axe Y de l'item dans le pdf
      textContent.items.forEach((item) => {
        // Nouvelle ligne si la position Y change significativement
        if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
          pageText += "\n";
        }
        pageText += item.str;
        lastY = item.transform[5];
      });
      
      bookString += pageText + "\n"; // == saut de page
    }
    // const regex_sep = new RegExp("(?<=\n)\s*(\d+)\s*\n", "g")
    const regex_sep = /(?=\n)\s+(\d+)\s+/g
    let matching_passage = [...bookString.matchAll(regex_sep)]
    console.log(matching_passage)
    let max_index = 0
    for(const [index, value] of matching_passage.entries()){
      max_index = Math.max(max_index, value[1])
    }
    const passage = {};
    for(let i = 1; i<=max_index;i++){
      let regex_text
      if (i !== max_index) {
        regex_text = new RegExp(`(?<=\\n)\\s*${i}\\s*\\n((.+\\n)+?)\\s*${i+1}`);
      }else {
        regex_text = new RegExp(`(?<=${i})\\s+((?:.+\\n){0,300})\\s*\\d*\\s+`);
      }
      const match = bookString.match(regex_text)
      this.working_data[i]["text"] =  match?.[1] || ""
    }
    // const regex_sep = /\s*(\d+)\s*/g
    // let matching_passage = [...bookString.matchAll(regex_sep)]
    // console.log(matching_passage)
    // let i = 0;
    // while (i < matching_passage.length) {
    //     if (i + 1 !== Number(matching_passage[i][1])) {
    //         console.log(`Index ${i} is not matching with value ${matching_passage[i][1]}`);
    //         console.log(`Element popped: ${matching_passage.splice(i, 1)}`);
    //         // Ne pas incrémenter i car on vient de supprimer un élément
    //     } else {
    //         i++; // Passer à l'élément suivant seulement si pas de suppression
    //     }
    // }
    // const passages = {};
    // for (const [index, value] of matching_passage.entries()) {
    //     let regex_text;
    //     if (index !== matching_passage.length - 1) {
    //         regex_text = new RegExp(`(?<=\\n)\\s*${value[1]}\\s*\\n((?:.+\\n)+?)\\s*${Number(value[1])+1}`);
    //     } else {
    //         regex_text = new RegExp(`(?<=\\n)\\s*${value[1]}\\s+((?:.+\\n)+)\\s*\\d*\\s+`);
    //     }
    //     const match = bookString.match(regex_text);
    //     this.working_data[value[1]]["text"] =  match?.[1] || ""
    // }

  }

  /**
   * Import a file and depending on his type (.csv or .pdf) calls a different fonction
   * @param {String} filename 
   * @returns 
   */
  async import(filename){
    try {
      let response = await fetch(filename);
  
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      let importedFile = await response.clone().blob()
      const extension = filename.split(".").pop().toLowerCase()
      console.log(extension)
      switch(extension){
        case "csv":
          let text_csv = await response.text();
          this.entry_csv_name = filename
          this.CSV = importedFile
          this.importCSV(text_csv)
          break
        case "pdf":
          this.entry_pdf_name = filename  
          this.PDF = importedFile
          this.importPDF()
          break
        default:
          throw new Error("File type is not supported")
      }
      // let papa_results = []
    } catch (error){
      console.error('Erreur lors de la récupération ou du traitement du fichier:', error);
      return null;
    }
  }

  toJSON(){
    let json_table = {
      nom: this.entry_csv_name.split('.')[0],
      liste_notes:[],
      dict_categories : {},
    }
    let noeud_table = {}
    let gen_sortieID = idGenerator()
    for(let nodeID in this.working_data){
      noeud_table[nodeID]={
        id: nodeID,
        contenu_texte: this.working_data[nodeID]["text"],
        SORTIE_id: {}
      }
      for(let i = 0; i < this.working_data[nodeID]["to"].length; i++){
        let sortieID = gen_sortieID.next().value
        noeud_table[nodeID]["SORTIE_id"][sortieID] = {
          id: sortieID,
          NOEUD_parent_id: nodeID,
          NOUEUD_destination_id: this.working_data[nodeID]["to"][i]["sortie"],
          fin:SORTIES_INV.includes(this.working_data[nodeID]["to"][i]["sortie"]),
          sortie_choix_libre: this.working_data[nodeID]["to"][i]["sortie_choix_libre"],
          note:{}
        }
        if(SORTIES_INV.includes(this.working_data[nodeID]["to"][i]["sortie"])){
          noeud_table[nodeID]["SORTIE_id"][sortieID]["note"]["fin_type"] = this.working_data[nodeID]["to"][i]["sortie"]
        }
        for(let note in this.working_data[nodeID]["to"][i]){
          if(note!="sortie" && note!="sortie_choix_libre" && this.working_data[nodeID]["to"][i][note]){
            noeud_table[nodeID]["SORTIE_id"][sortieID]["note"][note] = this.working_data[nodeID]["to"][i][note] 
          }
        }
      }
    }
    for(let note in this.working_data[1]["to"][0]){
      if(note!="sortie" && note!="sortie_choix_libre"){
        json_table["liste_notes"].push(note)
      }
    }
    json_table["dict_noeuds"] = noeud_table
    // let sortie_table = {}
    // let gen_sortieID = idGenerator()
    // for(let nodeID in this.working_data){
    //   for(let i = 0; i < this.working_data[nodeID]["to"].length; i++){
    //     let sortieID = gen_sortieID.next().value
    //       sortie_table[sortieID] = {
    //         NOEUD_parent_id: nodeID,
    //         NOUEUD_destination_id: this.working_data[nodeID]["to"][i]["sortie"],
    //         fin:SORTIES_INV.includes(this.working_data[nodeID]["to"][i]["sortie"]),
    //         sortie_choix_libre: this.working_data[nodeID]["to"][i]["sortie_choix_libre"],
    //         note:{}
    //       }
    //     for(let note in this.working_data[nodeID]["to"][i]){
    //       if(note!="sortie" && note!="sortie_choix_libre" && this.working_data[nodeID]["to"][i][note]){
    //         sortie_table[sortieID]["note"][note] = this.working_data[nodeID]["to"][i][note] 
    //       }
    //     }
    //   }
    // }
    let jsonstring = JSON.stringify(json_table, null, 2)
    let json_table_sortie = new Blob([jsonstring], { type: 'application/json' });
    const url = URL.createObjectURL(json_table_sortie);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table_noeud_${this.entry_csv_name.split('.')[0]}`;
    console.log(noeud_table[1])

    // Déclencher le téléchargement
    document.body.appendChild(a);
    a.click();

    // Nettoyer
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  export(){
    // Fonction pour échapper les valeurs contenant des virgules et faussant le csv sinon
    function escapeCSVValue(value) {
      // Si ce n'est pas un string, on retourne la valeur telle quelle
      if (typeof value !== 'string') return value;
      
      // Si la valeur est déjà entourée de guillemets, on la retourne telle quelle
      if (/^".*"$/.test(value)) return value;
      
      // Si la valeur contient des virgules ou des guillemets, on l'entoure de guillemets
      // et on double les guillemets existants (règle CSV)
      if (value.includes(',') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      // Sinon, on retourne la valeur sans modification
      return value;
    }
    // Initialise les headers
    const first_key = Object.keys(this.working_data)[0]
    let csv_array = [["numero_passage",]]
    csv_array[0] = csv_array[0].concat(Object.keys(this.working_data[first_key]["to"][0]))
    csv_array[0] = csv_array[0].concat(Object.keys(this.working_data[first_key]["tags"]).map(tag=> "ficusTag_"+tag))
    // loop sur l'objet de données
    for(let passage in this.working_data){
      // loop sur les sorties / lignes
      for(let sortie = 0; sortie < this.working_data[String(passage)]["to"].length; sortie++){
        let line_csv = [""]
        // loop sur le dico des sorties
        for(let sortie_tag in this.working_data[String(passage)]["to"][sortie]){
          line_csv.push(escapeCSVValue(this.working_data[String(passage)]["to"][sortie][sortie_tag]));
        }
        // rajoute le numéro de passage uniquement si c'est la 1ère sortie
        if(sortie===0){
          line_csv[0]=String([passage])
          // loop sur les tags, et le rajoute au csv
          for(let tag in this.working_data[String(passage)]["tags"]){
            line_csv.push(escapeCSVValue(this.working_data[String(passage)]["tags"][tag]["value"]))
          }
        }
        csv_array.push(line_csv)
      }
    }
    let csv_txt = ''
    console.log(csv_array)
    csv_array.forEach(row =>{
      csv_txt += row.join(',') + '\n'
    })
    const blob = new Blob([csv_txt], { type: 'text/csv;charset=utf-8,' })
    const objUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', objUrl)
    link.setAttribute('download', `${OBJ_TEST.entry_csv_name}`)
    link.textContent = 'Click to Download'
    
    return link
    
  }
}
// cytoscape.js ne permet pas de créer un héritage...
class Graph{
  constructor(options) {
    this.cy = cytoscape(options);
    // Recopie des méthodes de cytoscape
    for (const key in this.cy) {
      if (typeof this.cy[key] === 'function') {
        this[key] = (...args) => this.cy[key](...args);
      }
    }
  }
  refresh(layout="cose") {
    this.layout({name:layout}).run()
  }
}

function refresh(layout="cose"){
  cy_graph.layout({name:layout}).run()
}

function* idGenerator(start=0){
  let id = start
  while(true){
    yield id++;
  }
}

function initNodeSearch() {
  cy_graph.style()
    .selector('.highlighted-node')
    .style({
      'border-width': 4,
      'border-color': '#FF5722',
      'transition-property': 'border-width, border-color',
      'transition-duration': '0.3s'
    })
    .update(); // Important pour appliquer les changements
  cy_graph.style()
    .selector('.highlighted-edges')
    .style({
      'line-color': "#28a745",
      'width': '6px',
      'target-arrow-color': '#0f7627'
    })
    .update()
  cy_graph.style()
    .selector('.final-node')
    .style({
      'border-width': 4,
      'border-color': '#28a745',
      'transition-property': 'border-width, border-color',
      'transition-duration': '0.3s'
    })
    .update()
  cy_graph.style()
    .selector('.via-node')
    .style({
      'border-width': 4,
      'border-color': '#0f5c76',
      'transition-property': 'border-width, border-color',
      'transition-duration': '0.3s'
    })
    .update()
  // Crée l'interface de recherche
  const searchInput = document.getElementById('cy-search');
  const searchClear = document.getElementById('cy-search-clear');

  // Raccourci Ctrl+F
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  // Recherche lors de la frappe (avec délai de 300ms)
  let searchTimeout;
  let nodesInput = []
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if(searchInput.value.includes(',')){
        nodesInput = searchInput.value.split(',')
        if(nodesInput.length>2){
          fromToVia(nodesInput[0].trim(),nodesInput[2].trim(),nodesInput[1].trim())
        }else{
          fromToVia(nodesInput[0].trim(),nodesInput[1].trim())
        }
      }else{
        searchNodeById(searchInput.value.trim());
      }
    }, 300);
  });

  // Recherche par Entrée
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      if(searchInput.value.includes(',')){
        nodesInput = searchInput.value.split(',')
        if(nodesInput.length>2){
          fromToVia(nodesInput[0].trim(),nodesInput[2].trim(),nodesInput[1].trim())
        }else{
          fromToVia(nodesInput[0].trim(),nodesInput[1].trim())
        }
      }else{
        searchNodeById(searchInput.value.trim());
      }
    }
  });

  // Nettoyage
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    clearHighlight();
  });

  // Fonction principale de recherche
  function searchNodeById(nodeId) {
    clearHighlight();
    
    if (!nodeId) return;
    
    const node = cy_graph.$(`#${nodeId}`);
    
    if (node.length > 0) {
      // Style de surbrillance
      node.addClass('highlighted-node');
      cy_graph.animate({
        center: { eles: node },
        zoom: Math.min(cy_graph.zoom() * 1.2, 2), // Zoom limité à 2x
        duration: 300
      });
      // Feedback visuel
      searchInput.classList.add('is-valid');
      searchInput.classList.remove('is-invalid');
    } else {
      searchInput.classList.add('is-invalid');
      searchInput.classList.remove('is-valid');
    }
  }

  // Pour la doc : si l'utilisateur·ice entre 3 nombre séparés par des virgules
  // "from, via, to", sinon "from, to"
  async function fromToVia(node1,node2, via=null){
    clearHighlight()
    if(via){
      const segment1 = await fromToVia(node1,via)
      const segment2 = await fromToVia(via,node2)
      if(segment1.success && segment2.success){
        console.log("Réussi", segment1, segment2)
        cy_graph.$(`#${via}`).addClass('via-node')
        cy_graph.$(`#${node1}`).addClass('highlighted-node')
        cy_graph.$(`#${node2}`).addClass('final-node')
        segment1.path.addClass('highlighted-edges');
        segment2.path.addClass('highlighted-edges');
        cy_graph.nodes().removeClass('highlighted-edges')
      }else{
        clearHighlight()
        searchInput.classList.add('is-invalid');
        searchInput.classList.remove('is-valid');
      }
    }else{
      try{
        const dijkstra = cy_graph.elements().dijkstra({
          root: `#${node1}`,
          directed: true
        });
        // console.log(dijkstra, dijkstra.found)
        const path = dijkstra.pathTo(cy_graph.$(`#${node2}`));
        const distance = dijkstra.distanceTo(cy_graph.$(`#${node2}`))
        console.log("Dist :", distance)
        if(!path.empty() && distance !== Infinity){
          console.log(path)
          path.addClass('highlighted-edges');
          searchInput.classList.add('is-valid');
          searchInput.classList.remove('is-invalid');
          cy_graph.$(`#${node1}`).addClass('highlighted-node')
          cy_graph.$(`#${node2}`).addClass('final-node')
          cy_graph.nodes().removeClass('highlighted-edges')
          const edgeIds = path.edges().map(edge => edge.id());
          return { success: true, path: path };
        }else{
          searchInput.classList.add('is-invalid');
          searchInput.classList.remove('is-valid');
          return { success: false, path: [] };
        }
      } catch(error){
        console.error("Erreur dans fromToVia():", error);
        searchInput.classList.add('is-invalid');
        return { success: false, error: error.message };
      }
    }
    //{data : {id: `e${String(keys)}-${String(dico[keys]["to"][i]["sortie"])}`, source : String(keys), target : String(dico[keys]["to"][i]["sortie"])}}
  }
  function clearHighlight() {
    cy_graph.nodes().removeClass('highlighted-node');
    cy_graph.nodes().removeClass('final-node');
    cy_graph.nodes().removeClass('via-node');
    cy_graph.elements().removeClass('highlighted-edges');
    searchInput.classList.remove('is-valid', 'is-invalid');
  }
}

function lancerPropagation(passage_dico){
  // A modifier pour passer tout en false les propas
  function propagation(passage_dico, passage, biome){
    if (!(BIOMES.includes(biome))){
      BIOMES.push(biome)
    }
    let to_list = passage_dico[String(passage)]["to"]
    passage_dico[String(passage)]["tags"]["biomes"]["value"]=biome
    visited.add(passage)
    requestAnimationFrame(()=>{
      cy_graph.nodes(`#${passage}`).style('background-color', `hsl(${(BIOMES.indexOf(biome)*25)%360}, 70%, ${(65-((Math.round(BIOMES.indexOf(biome)/15)*22))%88 +88)%88}%)`); // Couleur à modifier?
      //cy_graph.nodes(`#${passage}`).style('background-color', `hsl(${(BIOMES.indexOf(biome)*30)%255}, 70%, 65%)`); anciennes couleurs
    })
    for(let i = 0; i < to_list.length; i++){
      if(!SORTIES_INV.includes(to_list[i]["sortie"]) && !passage_dico[to_list[i]["sortie"]]["tags"]["biomes"]["entry"] && !visited.has(to_list[i]["sortie"]) ){
        propagation(passage_dico, to_list[i]["sortie"], biome)
      }
    }
  }
  const entries = Object.keys(passage_dico)
    .filter(key => passage_dico[key].tags?.biomes?.entry)
    .map(key => ({ id: key, biome: passage_dico[key].tags.biomes.value }));

  const uniqueBiomes = new Set(BIOMES);
  const visited = new Set()
  requestAnimationFrame(()=>{
    entries.forEach(entry => {
      if (!uniqueBiomes.has(entry.biome)) {
        uniqueBiomes.add(entry.biome);
        BIOMES.push(entry.biome);
      }
      console.log(`Propagation du biome ${entry.biome}`)
      propagation(passage_dico, entry.id, entry.biome);
    })
  })


  // for(id in entries){
  //   console.log(`Propagation du biome ${entries[id]}`)
  //   propagation(passage_dico, id, entries[id])
  // }
  // return new Promise((resolve)=>{resolve()})
}

function createCyElementsFromDico(dico){
  cy_list = []
  for(let i = 1; i < Object.keys(dico)[0];i++){
    // dico[String(i)]={"text":"", "to":[], "from":[], "tags":{"biomes":"", "personnages":"", "actions":""}}
    cy_list.push({data: { id: String(i) }})
  }
  for(let keys in dico){
    cy_list.push({data : {id: String(keys)}})
  }
  for(let keys in dico){
    for (let i = 0; i < dico[keys]["to"].length; i++){
      if(!SORTIES_INV.includes(String(dico[keys]["to"][i]["sortie"])) && String(dico[keys]["to"][i]["sortie"]) != "v"){
        cy_list.push({data : {id: `e${String(keys)}-${String(dico[keys]["to"][i]["sortie"])}`, source : String(keys), target : String(dico[keys]["to"][i]["sortie"])}})
      }
    }
  }
  return cy_list
}

function createSampleCy(){
  cy_list = [{data: { id: -1}}]
  for(let i = 0; i<100;i++){
    cy_list.push({data: { id: String(i) }})
  }
  for(let i = 0; i<180;i++){
    cy_list.push({data: { id: `e${String(i)}`, source: `${Math.round(Math.random()*99)}`, target: `${Math.round(Math.random()*99)}` }})
  }
  return cy_list
}

function destroySideTab() {
  const element = document.getElementById("sideTab");
  if (element) {
    element.remove();
  }
}

function newTabOnClick(nodeID) {
  console.log("Affichage des entrées pour le passage : " + nodeID);

  destroySideTab();

  const div = document.createElement("div");
  div.id = "sideTab";
  div.className = "sideTab";
  document.body.appendChild(div);

  // Vérifiez si nodeID existe dans OBJ_TEST.working_data
  if (OBJ_TEST.working_data[nodeID]) {
    // Section pour le biome
    let biomeSection = document.createElement("div");
    biomeSection.className = "biome-section mb-3";
    div.appendChild(biomeSection);

    // Ajoutez un titre pour la section du biome
    let biomeTitle = document.createElement("h2");
    biomeTitle.innerText = "Biome";
    biomeSection.appendChild(biomeTitle);

    // Champ pour le biome
    let biomeGroup = document.createElement("div");
    biomeGroup.className = "input-group mb-3";
    biomeGroup.id = `biomeGroup`;
    biomeSection.appendChild(biomeGroup);

    let biomePrepend = document.createElement("div");
    biomePrepend.id = `biomePrepend`;
    biomePrepend.className = "input-group-prepend";
    biomeGroup.appendChild(biomePrepend);

    let biomeName = document.createElement("span");
    biomeName.innerText = "Biome";
    biomeName.className = "input-group-text";
    biomePrepend.appendChild(biomeName);

    let biomeContent = document.createElement("input");
    biomeContent.id = `biomeCore`;
    biomeContent.className = "form-control";
    biomeContent.value = OBJ_TEST.working_data[nodeID]["tags"]["biomes"]["value"] || "";
    biomeGroup.appendChild(biomeContent);

    // Ligne séparatrice
    let separator = document.createElement("hr");
    div.appendChild(separator);

    // Parcourez toutes les sorties pour le nodeID spécifié
    for (let i = 0; i < OBJ_TEST.working_data[nodeID]["to"].length; i++) {
      let sortie = OBJ_TEST.working_data[nodeID]["to"][i];

      // Créez un groupe pour chaque sortie
      let sortieGroup = document.createElement("div");
      sortieGroup.className = "sortie-group mb-3";
      sortieGroup.id = `sortieGroup${i}`;
      div.appendChild(sortieGroup);

      // Ajoutez un titre pour la sortie
      let sortieTitle = document.createElement("h3");
      sortieTitle.innerText = `Sortie ${i + 1}`;
      sortieGroup.appendChild(sortieTitle);

      // Parcourez les attributs de la sortie
      for (let attr in sortie) {
        if (attr !== "sortie" && attr !== "sortie_choix_libre") {
          let attrGroup = document.createElement("div");
          attrGroup.className = "input-group mb-3";
          attrGroup.id = `attrGroup${attr}${i}`;
          sortieGroup.appendChild(attrGroup);

          let attrPrepend = document.createElement("div");
          attrPrepend.id = `attrPrepend${attr}${i}`;
          attrPrepend.className = "input-group-prepend";
          attrGroup.appendChild(attrPrepend);

          let attrName = document.createElement("span");
          attrName.innerText = attr;
          attrName.className = "input-group-text";
          attrPrepend.appendChild(attrName);

          let attrContent = document.createElement("input");
          attrContent.id = `attrCore${attr}${i}`;
          attrContent.className = "form-control";
          attrContent.value = sortie[attr] || "";
          attrGroup.appendChild(attrContent);
        }
      }
    }

    let send_button = document.createElement("button");
    send_button.innerText = "Send data";
    send_button.addEventListener("click", () => {
      // Mise à jour du biome
      let biomeInputElement = document.getElementById(`biomeCore`);
      if (biomeInputElement && biomeInputElement.value !== "") {
        OBJ_TEST.working_data[nodeID]["tags"]["biomes"]["value"] = biomeInputElement.value;
      } else {
        OBJ_TEST.working_data[nodeID]["tags"]["biomes"]["value"] = "";
      }

      // Mise à jour des attributs des sorties
      for (let i = 0; i < OBJ_TEST.working_data[nodeID]["to"].length; i++) {
        for (let attr in OBJ_TEST.working_data[nodeID]["to"][i]) {
          if (attr !== "sortie" && attr !== "sortie_choix_libre") {
            let inputElement = document.getElementById(`attrCore${attr}${i}`);
            if (inputElement && inputElement.value !== "") {
              OBJ_TEST.working_data[nodeID]["to"][i][attr] = inputElement.value;
            }
          }
        }
      }
      console.log("Données mises à jour :", OBJ_TEST.working_data[nodeID]);
    });
    div.appendChild(send_button);
  } else {
    console.log("Node ID not found in working_data");
  }
}






async function createGraphe(url="A_COPIER_labyrinthe_de_la_mort - template_ldvelh.csv") {
  if (cy_graph) {
    cy_graph.destroy()
    cy_graph = null;
  }
  await new Promise(resolve => {
    if (document.readyState === 'complete') {
        resolve();
    } else {
        document.addEventListener('DOMContentLoaded', resolve);
    }
  });

  // Libérer la mémoire
  CSV_OBJ = {};
  BIOMES.length = 0;
  await OBJ_TEST.import(url)
  console.log(OBJ_TEST.working_data)
  cy_list = await createCyElementsFromDico(OBJ_TEST.working_data)
  console.log(cy_list)
  OBJ_TEST.working_data["162"]["tags"]["biomes"]={"value":"océan","entry":true}
  OBJ_TEST.working_data["250"]["tags"]["biomes"]={"value":"vallée","entry":true}
  OBJ_TEST.working_data["87"]["tags"]["biomes"]={"value":"glace","entry":true}
  OBJ_TEST.working_data["301"]["tags"]["biomes"]={"value":"chemin","entry":true}
  OBJ_TEST.working_data["402"]["tags"]["biomes"]={"value":"château","entry":true}
  OBJ_TEST.working_data["53"]["tags"]["biomes"]={"value":"marais","entry":true}
  
  //console.log(exportCSV(CSV_OBJ))
  cy_graph = cytoscape({

    container: document.getElementById('cy'), // container to render in
  
    elements: cy_list,
  
    style: [ // the stylesheet for the graph
      {
        selector: 'node',
        style: {
          'background-color': '#FFFACD', // Couleur temporaire
          'border-width':'1',
          'border-color': 'black',
          'border-opacity':'1',
          'label': 'data(id)',
          'text-valign':'center',
          'text-halign':'center',
          // 'font-size':10,
          // 'font-family':'Serif'
        }
      },
  
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      }
    ],
  
    layout: {
      name: 'cose',
      rows: 1
    }
  
  });
  cy_graph.boxSelectionEnabled(true);

  cy_graph.on('click', 'node', function(evt) {
    const clickedNode = this;
    const nodeID = clickedNode.id();
    console.log('clicked ' + nodeID);

    // Définissez explicitement les dimensions de base
    const baseWidth = 30;
    const baseHeight = 30;

    // Réinitialise tous les nœuds
    cy_graph.nodes().style({
        'width': baseWidth + 'px',
        'height': baseHeight + 'px',
        'border-width': '1',
        'border-color': 'black'
    });

    // Applique le style au nœud sélectionné (taille doublée + bordure rouge)
    clickedNode.style({
        'width': (baseWidth * 2) + 'px',  // taille du zoom
        'height': (baseHeight * 2) + 'px',  // taille du zoom
        'border-width': '4px',
        'border-color': 'red',
        'border-style': 'solid'
    });

    newTabOnClick(nodeID);
});

cy_graph.on('click', function(event) {
    // Vérifiez si le clic est sur le fond du graphe
    if (event.target === cy_graph) {
        // Définissez explicitement les dimensions de base
        const baseWidth = 30;
        const baseHeight = 30;

        // Réinitialise tous les nœuds
        cy_graph.nodes().style({
            'width': baseWidth + 'px',
            'height': baseHeight + 'px',
            'border-width': '1',
            'border-color': 'black'
        });

        console.log("Cacher la sideTab");
        destroySideTab();
    }
});

  
  // Stop propagation
  cy_graph.on('click', 'node', function(event) {
      event.stopPropagation();
  });
  
  var dijkstra = cy_graph.elements().dijkstra('#1', function(edge){
    return edge.data('weight');
  });
  var pathToJ = dijkstra.distanceTo( cy_graph.$('#304') );
  console.log(dijkstra)
  console.log(pathToJ)
  var aStar = cy_graph.elements().aStar({ root: "#172", goal: "#304" });
  console.log(aStar.path.select())
  console.log(aStar)
  console.log(OBJ_TEST.working_data)
  const progressBar = document.querySelector(".progress-bar");
  return new Promise(async (resolve)=>{
    progressBar.style.width = "64%";
    progressBar.innerHTML = "64%"
    await lancerPropagation(OBJ_TEST.working_data)
    initNodeSearch()
    resolve()
  })
}
// gérer l'importation du CSV dans le graphe
document.addEventListener("DOMContentLoaded", function () {
  let isImportating = false
  const propaBtn = document.getElementById("propaBtn");
  const modal = document.getElementById("csvModal");
  const openBtn = document.querySelector(".open-modal-btn");
  const closeBtn = document.querySelector(".close-btn");
  const closeCross = document.querySelector(".btn-close");
  const fileInput = document.getElementById("csvFile");
  let pdfInput = document.getElementById("pdfFile");
  const progress = document.querySelector(".progress");
  const progressBar = document.querySelector(".progress-bar");
  const numInput = document.getElementById("csvColumns");
  const refreshBtn = document.getElementById("refreshBtn")
  const downloadCSVButton = document.getElementById('downloadCSV');

  let importedCSV = null; // Variable pour stocker le fichier CSV

  downloadCSVButton.addEventListener('click', () => {
    let link = OBJ_TEST.export();  // Simuler le clic sur le lien pour télécharger
    link.click()
  });
  openBtn.addEventListener("click", () => {
    if(!isImportating){
      modal.style.display = "flex"
    }
  });
  propaBtn.addEventListener("click",()=>{
    lancerPropagation(OBJ_TEST.working_data)
  })
  refreshBtn.addEventListener("click",()=>{
    refresh()
  })
  closeBtn.addEventListener("click", () => {
    if(!isImportating){
      modal.style.display = "none"
      progressBar.style.display = "none"
      progressBar.style.width = "17%";
      progressBar.innerHTML = "17%"
    }
  });
  closeCross.addEventListener("click", () => {
    if(!isImportating){
      modal.style.display = "none"
      progressBar.style.display = "none"
      progressBar.style.width = "17%";
      progressBar.innerHTML = "17%"
    }
  });

  fileInput.addEventListener("change", (event) => {
    LAST_DEFAULT_TAG = numInput.value
    isImportating = true
      const file = event.target.files[0]; // Récupérer le fichier sélectionné
      progressBar.style.width = "17%";
      progressBar.innerHTML = "17%"
      if (file && file.type === "text/csv") {
        // modal.style.display = "none"
        importedCSV = URL.createObjectURL(file); // Générer une URL temporaire du fichier
        console.log("Fichier CSV chargé :", importedCSV, file.name);
        progress.style.display = "flex";
        progressBar.style.display = "flex";
        createGraphe(file.name).then(()=>{          
          setTimeout(() => {
            progressBar.style.width = "89%";
            progressBar.innerHTML = "89%";
            cy_graph.on("layoutstop", ()=>{
              console.log("CSV chargé et graphe mis en place")
              progressBar.style.width = "100%";
              progressBar.innerHTML = "100%"
              isImportating = false
            })
          }, 4000);
        })
      } else {
          alert("Veuillez sélectionner un fichier CSV valide !");
          fileInput.value = ""; // Réinitialiser l'input si le fichier n'est pas un CSV
      }
  });
  pdfInput.addEventListener("change", (event) => {
    isImportating = true
      const file = event.target.files[0]; // Récupérer le fichier sélectionné
      if (file && file.type === "application/pdf") {
        // modal.style.display = "none"
        importedPDF = URL.createObjectURL(file); // Générer une URL temporaire du fichier
        console.log("Fichier PDF chargé :", importedPDF, file.name);
        setTimeout(() => {
          OBJ_TEST.import(file.name)
        }, 100);
      } else {
          alert("Veuillez sélectionner un fichier PDF valide !");
          fileInput.value = ""; // Réinitialiser l'input si le fichier n'est pas un CSV
      }
  });
});
OBJ_TEST = new Data()
createGraphe("pirate_des_sept_mers.csv")