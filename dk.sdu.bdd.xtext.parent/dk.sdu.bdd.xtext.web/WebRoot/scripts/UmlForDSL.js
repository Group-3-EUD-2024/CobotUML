const stateDictionary = [
  "ON", "OFF", "sensed", "sorted", "active", "inactive", 
  "grapped", "released", "moving", "stopped", "idle", "engaged", "closed", "opened"
];
export default function updateTextEditorWithUmlData(umlData) {
  let dslContent = "model robotic_domain\n";  
  umlData.cells.forEach(cell => {
    // We are only interested in 'HeaderedRectangle' type cells
    if (cell.type === "standard.HeaderedRectangle") {
      let headerText = cell.attrs.headerText.text;  
      let bodyText = cell.attrs.bodyText.text;        
      let entityName = headerText.trim();
	  let methods = [];      
      let properties = [];
	  let states = [];
      // check attributes and methods from body text
      let bodyLines = bodyText.split('\n');
	  // remove '-' and '+' incase they are added to class diagram
	  bodyLines.forEach(line => {
	    if (line.includes('(')) {
	      // remove the parenthesis and arguments
	      methods.push(line.replace('+ ', '').replace(/\(.*\)/, ''));
	    } else {
	      // It's a property
		  if (stateDictionary.includes(line)) {
				states.push(line.replace('- ', ''));
        	} else {
				properties.push(line.replace('- ', ''));
        	}
	    }
	  });
      
      // Build the DSL entity part
      dslContent += `declarative entity ${entityName} {\n`;
		if (states.length > 0) {
          dslContent += `  states: ${states.join(', ')}\n`;
        }
		if (methods.length > 0) {
	    	dslContent += `  actions: ${methods.join(', ')}\n`;
      	}
      	if (properties.length > 0) {
        dslContent += `  properties: ${properties.join(', ')}\n`;
      	}
      dslContent += "}\n\n";
    }
  });
  return dslContent;
}