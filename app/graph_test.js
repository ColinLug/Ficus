// Avec une constante, tous les passages possèderaient la même instance de TAGS
// Changer un tag d'un passage viendrait à changer tous les autres
// const TAGS = {"biomes":"", "personnages":"", "actions":""}
let cy_graph = null
const TAG_VALUES = {}
SORTIES_INV = ["x","v","p","r"]
let CSV_OBJ = {}
let OBJ_TEST
let changes_bool = false
let CURR_TAG_NAME = "biomes"
let layout_stop = true

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
   * @param {Array} variable 
   * @param {String} value 
   * @param {Boolean} flood 
   */
  edit(target, variable, value, flood=false){
    changes_bool = true
    if(flood){
      this.working_data[target]["tags"][variable[0]]["value"] = value
      if(value !==""){
        this.working_data[target]["tags"][variable[0]]["entry"] = true
      }else{
        this.working_data[target]["tags"][variable[0]]["entry"] = false 
      }
    }else{
      this.working_data[target]["to"][variable[0]][variable[1]] = value
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
      skipEmptyLines: true, // Ignor empty ligns
      complete: (results) => {
        papa_results = results.data; // display data
      },
      error: (err) => {
        console.error('Erreur lors du parsing du CSV:', err);
      },
    });

    let results = {}
    let lastValidId = null
    
    if(papa_results){
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
    }
    console.log(results)
    this.working_data = results
    return results;
  }

  /**
   * Import text from a PDF and slice it by chapter, then add each chapter's text to its corresponding node in working_data
   * @returns {void}
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
        regex_text = new RegExp(`(?<=\\n)\\s*${i}\\s*\\n((.+\\n){0,100}?)\\s*${i+1}`);
      }else {
        regex_text = new RegExp(`(?<=${i})\\s+((?:.+\\n){0,300})\\s*\\d*\\s+`);
      }
      const match = bookString.match(regex_text)
      if(this.working_data[i]){
        this.working_data[i]["text"] =  match?.[1] || ""
      }else{
        this.working_data[i] = {"text":match?.[1] || "", "to":[], "tags":{"biomes":{"value":"", "entry":false}, "personnages":{"value":"", "entry":false}, "actions":{"value":"", "entry":false}}}
      }
    }
    if(this.entry_csv_name ==""){
      createGraphe(null)
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
  async import(fileURL, filename){
    changes_bool = true
    try {
      let response = await fetch(fileURL);
  
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

  /**
   * Let export the OBJ_TEST into a .json file working as a DataBase
   */
  toJSONFile(){
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

  /**
   * Help to export into a CSV the OBJ_TEST.working_data
   * @returns {object} a clickable link containing the export .csv file
   */
  export(){
    /**
     * Fonction pour échapper les valeurs contenant des virgules et faussant le csv sinon
     */
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
  toLocalStorage(){
    let save_obj = {}
    for(let key in this){
      if(this.hasOwnProperty(key) && typeof this[key] !== 'function'){
        save_obj[key]=this[key]
      }
    }
    return save_obj
  }
}
/**
 * /!\/!\Deprecated/!\/!\ 
 * The class was designed for extends the cytoscape class. Unfortunately,
 * there's no inheritance from the cytoscape class possible (at my knowledge).
 * see inheritance from ES6 classes
 */
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

/**
 * Let refresh the layout of the graph
 * @param {String} layout The layout wich you would like (only cose for now)
 */
function refresh(layout="cose"){
  if(layout_stop){
    console.log("bonjour")
    layout_stop = false
    cy_graph.layout({name:layout}).run()
    cy_graph.on("layoutstop", ()=>{
      layout_stop = true
    })
  }
}

/**
 * Circle through ids without overlapping
 * @param {Number} start the first id you would like
 */
function* idGenerator(start=0){
  let id = start
  while(true){
    yield id++;
  }
}

/**
 * Initiates all thing necessary to node search (like css for the cy obj,
 * the input group where to tap your search,...)
 */
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

  /**
   * Operates the search of one node, adding some classes to the node for recognition,
   * and a zoom to the node searched
   * @param {String} nodeId 
   * @returns {void} when no node id
   */
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

  /**
   * Let search for a path of nodes
   * @param {String} node1 the node where to start the path
   * @param {String} node2 if via=null, works like the end of the path, else act as the via node
   * @param {String} via act as the end of the path, if null skip it
   * @returns {Object} keys: success: bool, if success-> path: list[nodes] representing the path, if !success
   * -> error: error.message
   */
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
  /**
   * Clear all highlight or css class added when searching node
   */
  function clearHighlight() {
    cy_graph.nodes().removeClass('highlighted-node');
    cy_graph.nodes().removeClass('final-node');
    cy_graph.nodes().removeClass('via-node');
    cy_graph.elements().removeClass('highlighted-edges');
    searchInput.classList.remove('is-valid', 'is-invalid');
  }
}

/**
 * Let propagate a tag name, stop when the all nodes have been tagged
 * Differentiate between the {entry:true} tag, acting as door, and {entry:false}
 * wich can hold a tag but not propagate it when executing the function
 * @param {Object} passage_dico the dict containing all the infos necessary to propagate the tags
 * @param {String} tag_name the tag name to propagate
 */
function lancerPropagation(passage_dico, tag_name) {
  // Initialiser les valeurs si elles n'existent pas
  if (!TAG_VALUES[tag_name]) {
    TAG_VALUES[tag_name] = [];
  }

  const visited = new Set();
  /**
   * A recursive function to propagate the tag, stop when a node has already a tag
   * @param {Object} passage_dico the dict containing all the infos necessary to propagate the tags
   * @param {String} passage the node ID of the exit where to propagate
   * @param {String} value the tag's value to add
   * @param {String} tag_name the tag name to propagate
   */
  function propagation(passage_dico, passage, value, tag_name) {
    // Ajouter la valeur au tableau spécifique si elle n'y est pas
    if (!TAG_VALUES[tag_name].includes(value)) {
      TAG_VALUES[tag_name].push(value);
    }

    const to_list = passage_dico[String(passage)]["to"];
    passage_dico[String(passage)]["tags"][tag_name]["value"] = value;
    visited.add(passage);

    // Génération de couleur basée sur la position de la valeur dans la liste du tag
    const index = TAG_VALUES[tag_name].indexOf(value);
    const hue = (index * 25) % 360;
    const light = (65 - ((Math.floor(index / 15) * 22)) % 88 + 88) % 88;

    requestAnimationFrame(() => {
      cy_graph.nodes(`#${passage}`).style(
        'background-color',
        `hsl(${hue}, 70%, ${light}%)`
      );
    });

    for (let i = 0; i < to_list.length; i++) {
      const nextId = to_list[i]["sortie"];
      if (
        !SORTIES_INV.includes(nextId) &&
        !passage_dico[nextId]["tags"][tag_name]["entry"] &&
        !visited.has(nextId)
      ) {
        propagation(passage_dico, nextId, value, tag_name);
      }
    }
  }

  const entries = Object.keys(passage_dico)
    .filter(key =>
      tag_name &&
      passage_dico[key]?.tags &&
      passage_dico[key].tags[tag_name]?.entry
    )
    .map(key => ({
      id: key,
      value: passage_dico[key].tags[tag_name]?.value
    }));

  requestAnimationFrame(() => {
    entries.forEach(entry => {
      // Ajout éventuel à la liste de valeurs
      if (!TAG_VALUES[tag_name].includes(entry.value)) {
        TAG_VALUES[tag_name].push(entry.value);
        console.log(`Propagation de la valeur ${entry.value} pour ${tag_name}`);
      }
      propagation(passage_dico, entry.id, entry.value, tag_name);
    });
  });
}

/**
 * Transform a dictionnary of data into an array that can be used to generate a cytoscape graph
 * @param {Object} dico the dico to transform into the list usable by cytoscape
 * @returns {Array} an array of nodes usable by cytoscape
 */
function createCyElementsFromDico(dico){
  let cy_list = []
  let return_list = []
  for(let i = 1; i < Object.keys(dico)[0];i++){
    // dico[String(i)]={"text":"", "to":[], "from":[], "tags":{"biomes":"", "personnages":"", "actions":""}}
    cy_list.push({data: { id: String(i) }})
  }
  for(let keys in dico){
    cy_list.push({data : {id: String(keys)}})
  }
  for(let keys in dico){
    for (let i = 0; i < dico[keys]["to"].length; i++){
      if(!SORTIES_INV.includes(String(dico[keys]["to"][i]["sortie"])) && String(dico[keys]["to"][i]["sortie"]) != ""){
        cy_list.push({data : {id: `e${String(keys)}-${String(dico[keys]["to"][i]["sortie"])}`, source : String(keys), target : String(dico[keys]["to"][i]["sortie"])}})
      }else if(String(dico[keys]["to"][i]["sortie"]) == "r"){
        return_list.push(keys)
      }
    }
  }
  for(let keys in dico){
    for (let i = 0; i < dico[keys]["to"].length; i++){
      if(return_list.includes(String(dico[keys]["to"][i]["sortie"]))){
        cy_list.push({data : {id: `e${String(dico[keys]["to"][i]["sortie"])}-${String(keys)}`, source : String(dico[keys]["to"][i]["sortie"]), target : String(keys)}})
      }
    }
  }
  return cy_list
}

/**
 * /!\Unused/!\
 * Let create a sample list to test the cytoscape graph
 * @returns {Array} a list of nodes
 */
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

/**
 * Destroy the sideTab that appears when clicking on a node
 */
function destroySideTab() {
  const element = document.getElementById("sideTab");
  if(element){
    let nodeID = element.nodeID
    if(Object.keys(OBJ_TEST.working_data).includes(nodeID)){
      for(let tag in OBJ_TEST.working_data[nodeID].tags){
        let InputElement = document.getElementById(`${tag}Core`);
        if (InputElement && InputElement.value !== "") {
          OBJ_TEST.edit(nodeID, [tag], InputElement.value, true);
        } else {
          OBJ_TEST.edit(nodeID, [tag], "", true);
        }
      }

      // Mise à jour des attributs des sorties
      for (let i = 0; i < OBJ_TEST.working_data[nodeID]["to"].length; i++) {
        for (let attr in OBJ_TEST.working_data[nodeID]["to"][i]) {
          if (attr !== "sortie" && attr !== "sortie_choix_libre") {
            let inputElement = document.getElementById(`attrCore${attr}${i}`);
            if (inputElement && inputElement.value !== "") {
              OBJ_TEST.edit(nodeID, [i,attr], inputElement.value, false);
            }
          }
        }
      }
      changes_bool = true
      console.log("Données mises à jour ! To : ", OBJ_TEST.working_data[nodeID].to, ", tags: ", OBJ_TEST.working_data[nodeID].tags);
      element.remove();
    }else{
      element.remove();
    }
  }
}

/**
 * Creates an input group (Prepend-Input) with the following attributes
 * @param {String} nodeID the node's id, to read the data to display
 * @param {Array} tag the tag's name to be added 
 * @param {Boolean} bool_tag if it's a node's tag (true) or a exit's tag (false)
 * @param {Object} section where the input-group will be added
 * @returns {Object} A group of HTML objects (prepend-input) that will be displayed in the side tab
 */
function createInputGroup(nodeID, tag, bool_tag, section){
  let changeID
  let final_section
  if(bool_tag){
    changeID = tag[0]
    final_section = ""
  }else{
    changeID = "attr"
    final_section = tag[0] + tag [1]
  }
  let inpTagGroup = document.createElement("div");
  inpTagGroup.className = "input-group mb-3";
  inpTagGroup.id = `${changeID}Group${final_section}`;
  section.appendChild(inpTagGroup);

  let inpTagPrepend = document.createElement("div");
  inpTagPrepend.id = `${changeID}Prepend${final_section}`;
  inpTagPrepend.className = "input-group-prepend";
  inpTagGroup.appendChild(inpTagPrepend);

  let inpTagName = document.createElement("span");
  inpTagName.innerText = tag[0];
  inpTagName.className = "input-group-text";
  inpTagPrepend.appendChild(inpTagName);

  let inpTagContent = document.createElement("input");
  inpTagContent.id = `${changeID}Core${final_section}`;
  inpTagContent.className = "form-control";
  if(bool_tag){
    inpTagContent.value = OBJ_TEST.working_data[nodeID]["tags"][tag[0]]["value"] || "";
  }else{
    inpTagContent.value = OBJ_TEST.working_data[nodeID]["to"][tag[1]][tag[0]] || "";
  }
  inpTagGroup.appendChild(inpTagContent)
  return inpTagGroup
}
/**
 * Create and display (or not depending on the active tab) a close button to delete an exit
 * @param {String} nodeID the node's id, to read the data to display
 * @param {Number} i the index of the exit's array to wich create the close btn
 * @param {Object} tabLink where to attach the close btn
 * @returns {Object} The created button used to delete the exit
 */
function createCloseTabBtn(nodeID, i, tabLink){
  let closeBtn = document.createElement("button");
  let tabList = document.getElementById("sortieTabs")
  closeBtn.className = "nav-link close-tab";
  closeBtn.innerText = "×";
  closeBtn.style.display = "none";
  closeBtn.addEventListener("click", function (e) {
    if(confirm(`Voulez-vous vraiment supprimer la sortie ${OBJ_TEST.working_data[nodeID]["to"][i]["sortie"]}`)){
      changes_bool = true
      cy_graph.remove(`#e${nodeID}-${OBJ_TEST.working_data[nodeID]["to"][i]["sortie"]}`)
      e.stopPropagation(); // empêche d’activer l’onglet

      // Supprimer l'entrée dans OBJ_TEST
      OBJ_TEST.working_data[nodeID]["to"].splice(i, 1);

      // Supprimer l'onglet et son contenu
      const paneToRemove = document.getElementById("sortie" + i);
      if (paneToRemove) paneToRemove.remove();
      tabLink.remove();

      // Réactiver le 1er onglet si nécessaire
      const remainingTabs = tabList.querySelectorAll(".nav-link:not(.add-tab)");
      const remainingPanes = document.querySelector(".tab-content").querySelectorAll(".tab-pane");
      if (remainingTabs.length > 0) {
        remainingTabs[0].classList.add("active");
        remainingPanes[0].classList.add("show", "active");
      }

      console.log(`Sortie ${i} supprimée.`);
    }else{

    }
  });
  return closeBtn
}


/**
 * This function creates a side tab that appears when clicking on a node. It takes informations
 * from working_data object to populate the tab. The tab can be used to display and modify
 * the working_data object via tags or exits.
 * 
 * @param {String} nodeID The ID of the node that was clicked
 * 
 * @returns {void} This function does not return a value. It directly manipulates the DOM to
 *                  create and display the side tab.
 *
 * @example
 * // Assuming a node with ID "1" exists in the graph
 * newTabOnClick("1");
 */
function newTabOnClick(nodeID) {
  console.log("Affichage des entrées pour le passage : " + nodeID);

  destroySideTab();

  const div = document.createElement("div");
  div.nodeID=nodeID
  div.id = "sideTab";
  div.className = "sideTab";
  document.body.appendChild(div);

  // The creation of a fragment limits the acces of the DOM wich
  // can slow the process, add them to a fragment --> then to the DOM
  const fragment = document.createDocumentFragment()

  if (OBJ_TEST.working_data[nodeID]) {
    
    // Creation of the side tab div 
    let text_div = document.createElement("div")
    text_div.className = "mb-3 text-group"

    //Creation of the text section
    let text_title = document.createElement("h2")
    text_title.innerText = "Texte du passage"
    text_div.appendChild(text_title)
    let text_p = document.createElement("p")
    text_p.innerText = OBJ_TEST.working_data[nodeID].text
    text_p.id = "text"
    text_div.appendChild(text_p)
    fragment.appendChild(text_div)

    //Creation of the tag section
    let tagsSection = document.createElement("div");
    tagsSection.className = "biome-section mb-3";
    fragment.appendChild(tagsSection);
    let tagsTitle = document.createElement("h2");
    tagsTitle.innerText = "Tags";
    tagsSection.appendChild(tagsTitle);

    // Create all tag-input groups and add them to the tags section
    for(tag in OBJ_TEST.working_data[nodeID].tags){
     createInputGroup(nodeID,[tag], true, tagsSection)
    }

    // Create the 2 buttons, here the add tag button
    // This will help create a new tag
    let addTagBtn = document.createElement("button")
    addTagBtn.innerText="Ajouter un tag"
    addTagBtn.className = "btn btn-primary"
    addTagBtn.style.width = "50%"
    addTagBtn.style.display = "inline-block"
    addTagBtn.addEventListener("click", function () {
      addTagBtn.disabled = true
      let input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Nouveau tag";
      input.className = "form-control form-control-sm";
      input.style.width = "150px";
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          const newTagName = input.value.trim();
          if (!newTagName) return;
          if (OBJ_TEST.working_data[nodeID].tags[newTagName]){
            window.alert("Ce tag existe déjà");
            return;
          }
          for(node in OBJ_TEST.working_data){
            OBJ_TEST.working_data[node].tags[newTagName] = {"value":"", "entry":false}
          }
          changes_bool=true
          createInputGroup(nodeID, [newTagName], true, tagsSection)
          
          tagsSection.removeChild(input);
          rmvTagBtn.disabled = false
          addTagBtn.disabled = false
        }
      })
      tagsSection.appendChild(input)
      input.focus()
    })
    // Append the add button to the fragment
    fragment.appendChild(addTagBtn)

    //Here the delete tag button to remove a non-used tag
    let rmvTagBtn = document.createElement("button")
    rmvTagBtn.innerText="Supprimer un tag"
    rmvTagBtn.className = "btn btn-remove"
    rmvTagBtn.style.width = "50%"
    rmvTagBtn.style.display = "inline-block"
    rmvTagBtn.addEventListener("click", function () {
      let input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Tag à supprimer";
      input.className = "form-control form-control-sm";
      input.style.width = "150px";
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          const rmvTagName = input.value.trim();
          if (!rmvTagName) return;
          if (OBJ_TEST.working_data[nodeID].tags.hasOwnProperty(rmvTagName)){
            if(confirm(`Voulez-vous vraiment supprimer le tag ${rmvTagName} ?`)){
              for(node in OBJ_TEST.working_data){
                delete OBJ_TEST.working_data[node].tags[rmvTagName]
              }
              if(Object.keys(OBJ_TEST.working_data[nodeID].tags).length <= 1){
                rmvTagBtn.disabled = true
              }
              tagsSection.removeChild(document.getElementById(`${rmvTagName}Group`))
            }
          }else{
            window.alert(`Il n'existe aucun tag nommé ${rmvTagName}...`)
            tagsSection.removeChild(input);
            return
          }
          tagsSection.removeChild(input);
        }
      })
      tagsSection.appendChild(input)
      input.focus()
    })

    // Append the rmv button to the fragment
    fragment.appendChild(rmvTagBtn)

    // Just a separator to better reading
    let separator = document.createElement("hr");
    fragment.appendChild(separator);

    // Create the tabs
    let tabList = document.createElement("ul");
    tabList.className = "nav nav-tabs";
    tabList.id = "sortieTabs";
    let tabContent = document.createElement("div");
    tabContent.className = "tab-content";
    let sortiesTitle = document.createElement("h2");
    sortiesTitle.innerText = "Sorties";
    fragment.appendChild(sortiesTitle);

    // Circle through the exits
    for (let i = 0; i < OBJ_TEST.working_data[nodeID]["to"].length; i++) {
      let sortie = OBJ_TEST.working_data[nodeID]["to"][i];

      let tabLink = document.createElement("li");
      tabLink.className = "nav-item d-flex align-items-center";
      
      //Create a link for each tab
      let tabAnchor = document.createElement("a");
      tabAnchor.className = "nav-link" + (i === 0 ? " active" : "");
      tabAnchor.setAttribute("data-toggle", "tab");
      tabAnchor.innerText = "Sortie " + (OBJ_TEST.working_data[nodeID]["to"][i]["sortie"]);
      tabAnchor.addEventListener("click", function () {
        // Hide all tabs content
        let tabPanes = tabContent.querySelectorAll(".tab-pane");
        tabPanes.forEach(pane => pane.classList.remove("show", "active"));
      
        // Display the tab-active content
        let tabPane = document.getElementById("sortie" + i);
        tabPane.classList.add("show", "active");
      
        // Update the close btn and display
        let tabLinks = tabList.querySelectorAll(".nav-item");
        tabLinks.forEach(item => {
          const link = item.querySelector(".nav-link");
          const close = item.querySelector(".btn");
          if (link) link.classList.remove("active");
          if (close) close.style.display = "none";
        });
      
        this.classList.add("active");
        closeBtn.style.display = "inline-block";
      });


      tabLink.appendChild(tabAnchor);
      tabList.appendChild(tabLink);

      // Create each tab content
      let tabPane = document.createElement("div");
      tabPane.className = "tab-pane fade" + (i === 0 ? " show active" : "");
      tabPane.id = "sortie" + i;

      // Circle through the exits attributes/tags
      for (let attr in sortie) {
        if (attr !== "sortie") {
          // Create the input group (exit's tag - input)
          createInputGroup(nodeID, [attr,i], false, tabPane)
          // tabPane.appendChild(sortiesGroups)
        }
      }
      tabContent.appendChild(tabPane);
      let closeBtn = createCloseTabBtn(nodeID, i, tabLink)
      closeBtn.style.display = (i === 0) ? "inline-block" : "none";
      tabLink.appendChild(tabAnchor);
      tabLink.appendChild(closeBtn);
      tabList.appendChild(tabLink);
    }
    
    // Create a "+" tab that will let the user add exits
    let addTabLink = document.createElement("li");
    addTabLink.className = "nav-item";

    let addTabAnchor = document.createElement("a");
    addTabAnchor.className = "nav-link add-tab";
    addTabAnchor.href = "#";
    addTabAnchor.innerText = "+";
    addTabAnchor.style.fontWeight = "bold";
    
    // Let add a new exit on click (copy the exit's attributes from an other existing exit)
    addTabAnchor.addEventListener("click", function () {
      let input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Sortie vers n°...?";
      input.className = "form-control form-control-sm";
      input.style.width = "150px";
      input.addEventListener("keydown", function (e) {
        /**
         * Creates a new exit and tab corresponding
         */
        if (e.key === "Enter") {
          const sortieID = input.value.trim();
          if (!sortieID) return;
          for(let sort = 0; sort < OBJ_TEST.working_data[nodeID]["to"].length; sort++){
            if(OBJ_TEST.working_data[nodeID]["to"][sort]["sortie"] == sortieID){
              window.alert("Cette sortie existe déjà...")
              return
            }
          }
          
          if(Object.keys(OBJ_TEST.working_data).includes(sortieID)){
            cy_graph.add([{group:"edges", data: {id:`e${nodeID}-${sortieID}`, source:nodeID, target:sortieID}}])
          }else if(!SORTIES_INV.includes(sortieID)){
              return
          }
          changes_bool=true

    
          const newIndex = OBJ_TEST.working_data[nodeID]["to"].length;
          let sortie_obj = {}
          if(OBJ_TEST.working_data[nodeID]["to"].length > 0){
            for(let attr in OBJ_TEST.working_data[nodeID]["to"][0]){
              sortie_obj[attr]=""
            }
          }else{
            let ind_count = 0
            let continuer = true
            let index
            while (continuer && ind_count<Object.keys(OBJ_TEST.working_data).length) {
              index = Object.keys(OBJ_TEST.working_data)[ind_count]
              ind_count+=1
              for(let i = 0 ; i<OBJ_TEST.working_data[index]['to'].length; i++){
                console.log(Object.keys(OBJ_TEST.working_data[index]['to'][i]).length)
                if(Object.keys(OBJ_TEST.working_data[index]['to'][i]).length>1){
                  continuer = false
                }
              }
            }
            if(continuer){
              index = 0
            }
            console.log(index)
            for(let attr in OBJ_TEST.working_data[index]["to"][0]){
              sortie_obj[attr]=""
            }
          }
          sortie_obj["sortie"]=sortieID
          OBJ_TEST.working_data[nodeID]["to"].push(sortie_obj);
    
          // Remplacer l'input par un nouvel onglet
          let newTabLink = document.createElement("li");
          newTabLink.className = "nav-item";
    
          let newTabAnchor = document.createElement("a");
          newTabAnchor.className = "nav-link active";
          newTabAnchor.setAttribute("data-toggle", "tab");
          newTabAnchor.innerText = "Sortie " + sortieID;
          newTabAnchor.addEventListener("click", function () {
            document.querySelectorAll('.close-tab').forEach(btn => {
              btn.style.display = "none";
            });
            const closeBtn = this.parentNode.querySelector('.close-tab');
            if (closeBtn) closeBtn.style.display = "inline-block";
            tabList.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
            tabContent.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("show", "active"));
            newTabAnchor.classList.add("active");
            newTabPane.classList.add("show", "active");
          });
    
          // Créer le contenu du nouvel onglet
          let newTabPane = document.createElement("div");
          newTabPane.className = "tab-pane fade show active";
          newTabPane.id = "sortie" + newIndex;
          for (let attr in OBJ_TEST.working_data[nodeID]["to"][newIndex]) {
            if (attr !== "sortie" && attr !== "sortie_choix_libre") {
              createInputGroup(nodeID, [attr, newIndex], false, newTabPane)
            }
          }
          tabContent.appendChild(newTabPane);
          // Activer le nouvel onglet
          tabList.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
          tabContent.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("show", "active"));
          newTabAnchor.classList.add("active");
          newTabPane.classList.add("show", "active");

          let closeBtn = createCloseTabBtn(nodeID, newIndex, newTabLink)
          // closeBtn.style.display = "inline-flex";
          newTabLink.appendChild(newTabAnchor);
          newTabLink.appendChild(closeBtn)
          tabList.insertBefore(newTabLink, addTabLink);
    
          // Réafficher le bouton "+"
          document.getElementById("addToTagBtn").disabled = false
          console.log("pipiassn : ",newIndex,nodeID)
          if(Object.keys(OBJ_TEST.working_data[nodeID]['to'][newIndex]).length > 1){
            console.log("pipiassn : ",newIndex,nodeID)
            document.getElementById("rmvToTagBtn").disabled = false
          }
          addTabAnchor.innerText = "+";
          }
      });
    
      // Replace "+" by the input
      addTabAnchor.innerText = "";
      addTabAnchor.appendChild(input);
      input.focus();
    });

    addTabLink.appendChild(addTabAnchor);
    tabList.appendChild(addTabLink);

    fragment.appendChild(tabList);
    fragment.appendChild(tabContent);

    // Creates the 2 add/delete buttons for exit's tags
    let addToTagBtn = document.createElement("button")
    if(OBJ_TEST.working_data[nodeID].to.length<=0){
      addToTagBtn.disabled = true
    }
    addToTagBtn.innerText="Ajouter un tag"
    addToTagBtn.id="addToTagBtn"
    addToTagBtn.className = "btn btn-primary"
    addToTagBtn.style.width = "50%"
    addToTagBtn.style.display = "inline-block"
    addToTagBtn.addEventListener("click", function () {
      addToTagBtn.disabled = true
      let input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Nouveau tag de sortie";
      input.className = "form-control form-control-sm";
      input.style.width = "150px";
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          const newTagName = input.value.trim();
          const index = document.querySelector(".show").id.substring(6)
          if (!newTagName) return;
          if (OBJ_TEST.working_data[nodeID].to.includes(newTagName)){
            window.alert("Ce tag existe déjà");
            return;
          }
          for(node in OBJ_TEST.working_data){
            for(let i = 0; i < OBJ_TEST.working_data[node]['to'].length; i++){
              OBJ_TEST.working_data[node]['to'][i][newTagName] = ""
            }
          }
          changes_bool=true
          createInputGroup(nodeID, [newTagName, index], false, document.getElementById("sortie"+index))
          
          document.getElementById("sortie"+index).removeChild(input);
          rmvToTagBtn.disabled = false
          addToTagBtn.disabled = false
        }
      })
      document.getElementById("sortie"+document.querySelector(".show").id.substring(6)).appendChild(input)
      input.focus()
    })
    fragment.appendChild(addToTagBtn)

    let rmvToTagBtn = document.createElement("button")
    if(OBJ_TEST.working_data[nodeID].to.length<=0){
      rmvToTagBtn.disabled = true
    }
    rmvToTagBtn.innerText="Supprimer un tag"
    rmvToTagBtn.id = "rmvToTagBtn"
    rmvToTagBtn.className = "btn btn-remove"
    rmvToTagBtn.style.width = "50%"
    rmvToTagBtn.style.display = "inline-block"
    rmvToTagBtn.addEventListener("click", function () {
      let input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Tag de sortie à supprimer";
      input.className = "form-control form-control-sm";
      input.style.width = "150px";
      input.addEventListener("keydown", function (e) {
        const index = document.querySelector(".show").id.substring(6)
        if (e.key === "Enter") {
          const rmvTagName = input.value.trim();
          if (!rmvTagName) return;
          if (OBJ_TEST.working_data[nodeID].to[index].hasOwnProperty(rmvTagName)){
            if(confirm(`Voulez-vous vraiment supprimer le tag ${rmvTagName} ?`)){
              for(node in OBJ_TEST.working_data){
                for(let i = 0; i < OBJ_TEST.working_data[node]['to'].length; i++){
                  delete OBJ_TEST.working_data[node]['to'][i][rmvTagName]
                }
              }
              if(Object.keys(OBJ_TEST.working_data[nodeID].to[0]).length <= 1){
                rmvToTagBtn.disabled = true
              }
              document.getElementById("sortie"+index).removeChild(document.getElementById(`attrGroup${rmvTagName}${index}`))
            }
          }else{
            window.alert(`Il n'existe aucun tag nommé ${rmvTagName}...`)
            document.getElementById("sortie"+index).removeChild(input);
            return
          }
          document.getElementById("sortie"+index).removeChild(input);
        }
      })
      document.getElementById("sortie"+document.querySelector(".show").id.substring(6)).appendChild(input)
      input.focus()
    })
    fragment.appendChild(rmvToTagBtn)
    let separator2 = document.createElement("hr");
    
    // Just a seperator to better reading
    fragment.appendChild(separator2);

    // Create the send button that will save the data from the inputs groups to
    // OBJ_TEST.working_data dictionnary (can be achieved simply by closing the side tab too)
    let send_button = document.createElement("button");
    send_button.innerText = "Sauvegarder les données";
    send_button.className = "btn send-btn"
    send_button.addEventListener("click", () => {
      // Mise à jour des tags
      for(let tag in OBJ_TEST.working_data[nodeID].tags){
        let InputElement = document.getElementById(`${tag}Core`);
        if (InputElement && InputElement.value !== "") {
          OBJ_TEST.edit(nodeID, [tag], InputElement.value, true);
        } else {
          OBJ_TEST.edit(nodeID, [tag], "", true);
        }
      }

      // Mise à jour des attributs des sorties
      for (let i = 0; i < OBJ_TEST.working_data[nodeID]["to"].length; i++) {
        for (let attr in OBJ_TEST.working_data[nodeID]["to"][i]) {
          if (attr !== "sortie" && attr !== "sortie_choix_libre") {
            let inputElement = document.getElementById(`attrCore${attr}${i}`);
            if (inputElement && inputElement.value !== "") {
              OBJ_TEST.edit(nodeID, [i,attr], inputElement.value, false);
            }
          }
        }
      }
      console.log("Données mises à jour :", OBJ_TEST.working_data[nodeID]);
    });

    //Creates the delete node button that deletes the clicked node
    let supp_node_button = document.createElement("button");
    supp_node_button.innerText = "Supprimer le noeud";
    supp_node_button.className = "btn del-btn"
    supp_node_button.addEventListener("click", () => {
      if(confirm(`Voulez-vous réellement supprimer le noeud ${nodeID}`)){
        delete OBJ_TEST.working_data[nodeID]
        cy_graph.$(`#${nodeID}`).remove()
      }else{}
    });
    fragment.appendChild(send_button);
    fragment.appendChild(supp_node_button);
    div.appendChild(fragment)
  } else {
    console.log("Node ID not found in working_data");
  }
}


/**
 * Create a graph from a CSV by calling createCyElementsFromDico
 * Add differents attributes to the cy_graph (style, events,...)
 * @param {String} url The csv path from whom the datas will be extracted and displayed as a graph
 * @returns {void}
 */
async function createGraphe(url=null, nameOfFile=null) {
  if(url){
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
    await OBJ_TEST.import(url, nameOfFile)
    console.log(OBJ_TEST.working_data)
    cy_list = await createCyElementsFromDico(OBJ_TEST.working_data)
    console.log(cy_list)
    // OBJ_TEST.working_data["162"]["tags"]["biomes"]={"value":"océan","entry":true}
    // OBJ_TEST.working_data["250"]["tags"]["biomes"]={"value":"vallée","entry":true}
    // OBJ_TEST.working_data["87"]["tags"]["biomes"]={"value":"glace","entry":true}
    // OBJ_TEST.working_data["301"]["tags"]["biomes"]={"value":"chemin","entry":true}
    // OBJ_TEST.working_data["402"]["tags"]["biomes"]={"value":"château","entry":true}
    // OBJ_TEST.working_data["53"]["tags"]["biomes"]={"value":"marais","entry":true}
  }else{
    cy_list = await createCyElementsFromDico(OBJ_TEST.working_data)
  }
  
  //console.log(exportCSV(CSV_OBJ))
  cy_graph = cytoscape({

    container: document.getElementById('cy'), // container to render in
  
    elements: cy_list,
  
    style: [ // the stylesheet for the graph
      {
        selector: 'node',
        style: {
          'background-color': '#9cbeb4', // Couleur temporaire
          'border-width':'1',
          'border-color': 'black',
          'border-opacity':'1',
          'label': 'data(id)',
          'text-valign':'center',
          'text-halign':'center',
          // 'font-size':10,
          // 'font-family':'Serif'
          'background-position-x':'120%',
          'background-position-y':'-3px',
          'background-clip':'none',
          'background-width':'16px',
          'background-height':'16px'
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
  
  for(let key in OBJ_TEST.working_data){
    for (let i = 0; i < OBJ_TEST.working_data[key]["to"].length; i++){
      if(SORTIES_INV.includes(String(OBJ_TEST.working_data[key]["to"][i]["sortie"]))){
        switch(String(OBJ_TEST.working_data[key]["to"][i]["sortie"])){
          case 'x':
            cy_graph.$(`#${key}`).style('background-image','/images/defeat.png')
            break;
          case 'v':
            cy_graph.$(`#${key}`).style('background-image','/images/victory.png')
            break;
          case 'p':
            cy_graph.$(`#${key}`).style('background-image','/images/partial_vict.png')
            break;
        }
      }
    }
  }

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
    // Verify if the click is on the background
    if (event.target === cy_graph) {
        // Define the dimensions of the nodes
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

/**
 * If right-click on background, show a input to add node
 */
cy_graph.on('cxttap', function(event) {
  // Verify if the click is on the background
  if (event.target === cy_graph) {
    const position = event.renderedPosition;
    
    // Show the input form at the clicked position
    const creator = document.getElementById('node-creator');
    creator.style.display = 'inline-flex';
    creator.style.left = `${position.x}px`;
    creator.style.top = `${position.y}px`;

    // Focus the input field
    document.getElementById('new-node-name').focus();
  }
});

// Handle "Add" button click
document.getElementById('add-node-btn').addEventListener('click', function() {
  const newNodeName = document.getElementById('new-node-name').value.trim();
  
  if (newNodeName) {
    const creator = document.getElementById('node-creator');
    const pos = { 
      x: parseInt(creator.style.left), 
      y: parseInt(creator.style.top) 
    };

    try{
      cy_graph.add({
        group: 'nodes',
        data: { id: newNodeName, label: newNodeName },
        position: { x: pos.x, y: pos.y }
      });
    }catch{
      document.getElementById('new-node-name').classList.add('is-invalid');
      document.getElementById('new-node-name').classList.remove('is-valid');
      return
    }
    document.getElementById('new-node-name').classList.add('is-valid');
    document.getElementById('new-node-name').classList.remove('is-invalid');
    OBJ_TEST.working_data[newNodeName] = {"text": "", "to":[], "tags":{}}
    for(let tag in OBJ_TEST.working_data[Object.keys(OBJ_TEST.working_data)[0]]["tags"]){
      OBJ_TEST.working_data[newNodeName]["tags"][tag] = {"value":"", "entry":false}
    }
    // Reset and hide the form
    document.getElementById('new-node-name').value = '';
    creator.style.display = 'none';
  }
});

// Handle "Cancel" button click
document.getElementById('cancel-node-btn').addEventListener('click', function() {
  document.getElementById('new-node-name').value = '';
  document.getElementById('node-creator').style.display = 'none';
  document.getElementById('new-node-name').classList.remove('is-invalid');
  document.getElementById('new-node-name').classList.remove('is-valid');
});
  
  // Stop propagation
  cy_graph.on('click', 'node', function(event) {
      event.stopPropagation();
  });
  console.log(OBJ_TEST.working_data)
  const progressBar = document.querySelector(".progress-bar");
  return new Promise(async (resolve)=>{
    progressBar.style.width = "64%";
    progressBar.innerHTML = "64%"
    await lancerPropagation(OBJ_TEST.working_data, CURR_TAG_NAME)
    initNodeSearch()
    resolve()
  })
}
// Creates the buttons/interactives elements event listeners
document.addEventListener("DOMContentLoaded", function () {
  // Get all buttons/interactive elements in variables to further manipulation
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
  const refreshBtn = document.getElementById("refreshBtn")
  const downloadCSVButton = document.getElementById('downloadCSV');
  const downloadPDFButton = document.getElementById('downloadPDF');
  const leftArr = document.querySelector(".svg-arrow-left");
  const rightArr = document.querySelector(".svg-arrow");

  let importedCSV = null;

  // Circle through the tags by -1 when clicking
  leftArr.addEventListener("click", () => {
    let tags_array = Object.keys(OBJ_TEST.working_data[Object.keys(OBJ_TEST.working_data)[0]]["tags"])
    let current_tag = propaBtn.innerText.match(/(?<=Propager[ ])\w+/g)[0]
    let curr_index = tags_array.indexOf(current_tag)
    let new_index = (curr_index - 1 + tags_array.length)%tags_array.length
    propaBtn.innerText = `Propager ${tags_array[new_index]}`
    CURR_TAG_NAME = tags_array[new_index]
  });
  // Circle through the tags by +1 when clicking
  rightArr.addEventListener("click", () => {
    let tags_array = Object.keys(OBJ_TEST.working_data[Object.keys(OBJ_TEST.working_data)[0]]["tags"])
    let current_tag = propaBtn.innerText.match(/(?<=Propager[ ])\w+/g)[0]
    let curr_index = tags_array.indexOf(current_tag)
    let new_index = (curr_index + 1 + tags_array.length)%tags_array.length
    propaBtn.innerText = `Propager ${tags_array[new_index]}`
    CURR_TAG_NAME = tags_array[new_index]
  });
  
  // Let download the CSV file when clicked
  downloadCSVButton.addEventListener('click', () => {
    let link = OBJ_TEST.export();  // Simuler le clic sur le lien pour télécharger
    link.click()
  });
  downloadPDFButton.addEventListener('click', () => {
    // let link = OBJ_TEST.export();  // Simuler le clic sur le lien pour télécharger
    // link.click()
    OBJ_TEST.toJSONFile()
  });

  // Let open the modal window wich have buttons to import CSV or PDF
  openBtn.addEventListener("click", () => {
    if(!isImportating){
      modal.style.display = "flex"
    }
  });

  // Let propagate the current displayed tag
  propaBtn.addEventListener("click",()=>{
    console.log(CURR_TAG_NAME)
    cy_graph.nodes().style('background-color', '#9cbeb4');
    lancerPropagation(OBJ_TEST.working_data, CURR_TAG_NAME)
  })

  // Refresh the layout when clicked
  refreshBtn.addEventListener("click",()=>{
    refresh()
  })

  // Creates the actions of the modal window
  // Here the close modal buttons
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

  // The importing CSV file button
  fileInput.addEventListener("change", (event) => {
    isImportating = true
    const file = event.target.files[0]; // Get selected file
    progressBar.style.width = "17%";
    progressBar.innerHTML = "17%"
    if (file && file.type === "text/csv") {
      // modal.style.display = "none"
      importedCSV = URL.createObjectURL(file); //Create a temporary URL
      console.log("Fichier CSV chargé :", importedCSV, file.name);
      progress.style.display = "flex";
      progressBar.style.display = "flex";
      createGraphe(importedCSV, file.name).then(()=>{          
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
        fileInput.value = ""; //Reset input if not CSV file
    }
  });
  
  // The importing PDF file button
  pdfInput.addEventListener("change", (event) => {
    isImportating = true
    const file = event.target.files[0]; // Get selected file
    if (file && file.type === "application/pdf") {
      // modal.style.display = "none"
      importedPDF = URL.createObjectURL(file); //Create a temporary URL
      console.log("Fichier PDF chargé :", importedPDF, file.name);
      setTimeout(() => {
        OBJ_TEST.import(importedPDF, file.name)
        isImportating = false
      }, 100);
    } else {
        alert("Veuillez sélectionner un fichier PDF valide !");
        fileInput.value = ""; //Reset input if not PDF file
    }
  });
});
OBJ_TEST = new Data()
// createGraphe("pirate_des_sept_mers.csv")

// Interval letting save the project
setInterval(() => {
  if(changes_bool){
    changes_bool = false
    localStorage.setItem('autosave', JSON.stringify(OBJ_TEST.toLocalStorage()));
    console.log("Sauvegarde automatique effectuée.")
  }
}, 3000);

// Init data from cache
let saved_data;
try {
  saved_data = JSON.parse(localStorage.getItem('autosave'));
} catch (e) {
  console.error("Erreur de lecture des données", e);
  saved_data = null;
}
if (saved_data) {
  for(let key in saved_data){
    OBJ_TEST[key] = saved_data[key]
  }
  console.log(OBJ_TEST.working_data)
  createGraphe(null);
}