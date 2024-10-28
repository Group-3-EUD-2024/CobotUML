function readFile() {
	let input = document.getElementById('file-input')
	let file = input.files[0]
	let reader = new FileReader()
	reader.readAsText(file, 'UTF-8')
	reader.onload = () => {
		var fileContent = reader.result
		let editor = getCurrentAceEditor()
		let doc = editor.env.document.doc
		if (doc !== null || doc !== undefined) {
			doc.setValue(fileContent)
			let fileName = document.getElementById('fileName');
			fileName.value = file.name
			localStorage.setItem("fileName", file.name)
		}
	}
}

function printChildren(a) {
	let s = "";
	a.forEach((element) => {
		s = s + element.getFieldValue("TEXT");
	})
	return s;
}

function onDocumentChange() {
	let editor = getCurrentAceEditor()
	let document = editor.env.document.doc
	let fileContent = document.getValue()
	localStorage.setItem(editor.container.id + "fileContent", fileContent)
}

function getSavedDocument(editor) {
	let doc = editor.env.document.doc
	let editorId = editor.container.id
	let fileContent = localStorage.getItem(editorId + "fileContent");
	if (fileContent !== null) {
		doc.insert({ row: 0, column: 0 }, fileContent)
	}
	let fileName = localStorage.getItem(editorId + "fileName")
	if (fileContent !== null) {
		let fileNameElement = document.getElementById(editorId + 'fileName');
		if (fileNameElement !== null)
			fileNameElement.value = fileName
	}
}

let entities = document.getElementById('xtext-editor-entities')
let entitiesTab = document.getElementById('entity-tab')
let entitiesBlock = document.getElementById('blockly-editor')
let scenario = document.getElementById('xtext-editor-scenarios')
let scenarioTab = document.getElementById('scenario-tab')
let scenarioBlock = document.getElementById('blockly-editor2')
let blockTab = document.getElementById('blocks-tab');
let umlTab = document.getElementById('uml-tab');
let umlContainer = document.getElementById('uml-container');
let warningMessage = document.getElementById('warning-message')
let originalToolbox;
let entitiesToolboxInjected = false;
let scenarioToolboxInjected = false;
let scenarioWorkspace;
let entityWorkspace;
let umlWorkspace;
let blockArray;
let autoGeneratedEntityBlocks = false;
let autoGeneratedScenarioBlocks = false;
let currentAst;
let currentTab = entitiesTab;
let currentBlockly = entitiesBlock;
let enabledByText = false;
let enabledByCodeBlocks = false;

const runCodeForEntity = (element) => {
	if (entitiesToolboxInjected && element === entitiesTab && !autoGeneratedEntityBlocks)
	{
		console.log("runCodeForEntity");
		let entityCode = getBddGenerator(blockArray).workspaceToCode(entityWorkspace);

		entityCode = entityCode.replaceAll('declarative entity', '\n declarative entity');
		entityCode = entityCode.replaceAll('imperative entity', '\n imperative entity');
		entityCode = entityCode.replaceAll('actions:', '\n actions:');
		entityCode = entityCode.replaceAll('states:', '\n states:');
		entityCode = entityCode.replaceAll('properties:', '\n properties:');
		// console.log(entityCode);

		let editor = getCurrentAceEditor()
		let doc = editor.env.document.doc
		if (doc !== null || doc !== undefined) {
			doc.setValue(entityCode.replace(/^\s*$\n?/gm, '').replace(/ +/g, ' ')); // removes blank lines & multiple spaces
			autoGeneratedEntityBlocks = false;
		}
	}	
};

const runCodeForScenario = (element) => {
	if (scenarioToolboxInjected && element === scenarioTab && !autoGeneratedScenarioBlocks)
	{
		console.log("runCodeForScenario");
		let scenarioCode = getBddGenerator(blockArray).workspaceToCode(scenarioWorkspace);
		
		scenarioCode = scenarioCode.replaceAll('Scenario:', '\n Scenario:');
		scenarioCode = scenarioCode.replaceAll('Given', '\n Given');
		scenarioCode = scenarioCode.replaceAll('When', '\n When');
		scenarioCode = scenarioCode.replaceAll('Then', '\n Then');
		scenarioCode = scenarioCode.replaceAll('And', '\n And');
		
		let editor = getCurrentAceEditor()
		let doc = editor.env.document.doc
		if (doc !== null || doc !== undefined) {
			doc.setValue(scenarioCode.replace(/^\s*$\n?/gm, '').replace(/ +/g, ' ')); // removes blank lines & multiple spaces	
			autoGeneratedScenarioBlocks = false;
		}
	}	
};

function displayEditor(currEditor, newEditor, currBlockly, newBlockly) {
	currEditor.style.display = "none"
	currBlockly.style.display = "none"
	newEditor.style.display = "block"
	newBlockly.style.display = "block"
}

function switchEditor(e) {
	if (e.target.disabled)
		return;

	var b = ""
	if (e.target != currentTab) {
		removeSelectionBorder(currentTab)
		let editorId = e.target.dataset.editorId
		// Hide UML container if switching to a different editor
        umlContainer.style.display = "none";
		if (editorId == "xtext-editor-entities") { b = "blockly-editor" }
		else if (editorId == "xtext-editor-scenarios") { b = "blockly-editor2" }
		else if (editorId == "xtext-editor-diagrams") { b = "blockly-editor3"}
		
		console.log(editorId)
		let editor = document.getElementById(editorId)
		let blockly = document.getElementById(b)
		blockly.style.display = "block";
		displayEditor(currentEditor, editor, currentBlockly, blockly)
		if (editorId == "xtext-editor-diagrams") {
			runExampleUml();
		}
		currentEditor = editor
		currentTab = e.target
		currentBlockly = blockly
		setSelectionBorder(currentTab)
    	loadBlocks(currentTab, true);
	}
}

function onEntityEditorChange() {
	console.log("Test")
	if (entities.innerText != null && entities.innerText.replace(/[^a-zA-Z]/g, '').trim() !== '') {
		setEnabled(scenarioTab);
		enabledByText = true;

		fetch('/xtext-service/ast?resource=multi-resource/scenarios.bdd')
			.then(response => response.json())
			.then(response => {
				autoGeneratedEntityBlocks = true;
				if (currentAst !== response.ast)
				{
					generateBlocksFromAst(response.ast, entityWorkspace, blockArray, 'entities');
					currentAst = response.ast;
					console.log(response.ast);
				}
			});
	}
	else if (!enabledByCodeBlocks) {
		setDisabled(scenarioTab);
		enabledByText = false;
	}
}

function onScenarioEditorChange() {
	fetch('/xtext-service/ast?resource=multi-resource/scenarios.bdd')
		.then(response => response.json())
		.then(response => {
			autoGeneratedScenarioBlocks = true;
			if (currentAst !== response.ast)
			{
				generateBlocksFromAst(response.ast, scenarioWorkspace, blockArray, 'scenarios');
				currentAst = response.ast;
			}
		});
}

function setSelectionBorder(element) {
	element.style.border = "2px black solid";
}

function removeSelectionBorder(element) {
	element.style.border = "2px white solid"
}

function setDisabled(element) {
	element.style.backgroundColor = "#f2f2f2";
	element.style.pointerEvents = "none";
	element.disabled = true;
	warningMessage.style.visibility = "visible";
}

function setEnabled(element) {
	element.style.backgroundColor = "#ddd";
	element.style.pointerEvents = "auto";
	element.disabled = false;
	warningMessage.style.visibility = "hidden";
}

if (entitiesTab != undefined)
	entitiesTab.onclick = switchEditor
if (scenarioTab != undefined)
	scenarioTab.onclick = switchEditor
if (umlTab != undefined)
	umlTab.onclick = switchToUml
if (blockTab != undefined)
	blockTab.onclick = switchToBlock
setEnabled(entitiesTab);
setSelectionBorder(entitiesTab);

window.onload = () => {
  setTimeout (() => {
	currentEditor = entities;
    for (let editor of editors) {
      getSavedDocument(editor)
      let document = editor.env.document.doc
      document.on('change', onDocumentChange)
    }
    let input = document.getElementById('file-input')
    input.addEventListener('change', readFile) 

    loadBlocks(currentTab, false);
	onEntityEditorChange();
  }, 400)
}

let astBtn = document.getElementById('get-ast')
astBtn.onclick = () => {
	fetch('/xtext-service/ast?resource=multi-resource/scenarios.bdd')
		.then(response => response.json())
		.then(response => {
			console.log(response);
			console.log(JSON.stringify(response));
		})
}

function loadBlocks(element, skipAddingBlocks) {
	fetch('/xtext-service/blocks?resource=multi-resource/scenarios.bdd')
		.then(response => response.json())
		.then(response => {
			// console.log(response)
			response.blocks = JSON.parse(response.blocks)
			response.toolBox = JSON.parse(response.toolBox)
			blockArray = response.blocks

      		if (!skipAddingBlocks)
			  Blockly.defineBlocksWithJsonArray(response.blocks)

			let id_validator = function(newValue) {
				//if it returns '', then the input is correct
				let res = newValue.replace(/[\^a-zA-Z_][a-zA-Z_0-9]*/g, '')

				if (res == '') {
					return undefined;
				}
				return null;
			}

			Blockly.Blocks["ID"] = {
				init: function() {
					this.setColour(200)
					this.setOutput(true, 'ID')
					this.appendDummyInput()
						.appendField(new Blockly.FieldTextInput('ID', id_validator), 'TEXT_INPUT');

				}
			}

			let string_validator = function(newValue) {

				let res = newValue.replace(/[^\"]*/g, '')
				if (res == '') {
					return undefined;
				}
				return null;
			}


			Blockly.Blocks["STRING"] = {
				init: function() {
					this.setColour(300)
					this.setOutput(true, 'STRING')
					this.appendDummyInput()
						.appendField("\"")
						.appendField(new Blockly.FieldTextInput('String', string_validator), 'TEXT_INPUT')
						.appendField("\"");
				}
			}

			let termArr = []
			termArr.push({ "kind": "block", "type": "ID" })
			termArr.push({ "kind": "block", "type": "STRING" })

			response.toolBox.contents.push({ "kind": "category", "name": "Terminals", contents: termArr })

      		originalToolbox = response.toolBox;
			response.toolBox.contents = filterCategories(element, originalToolbox.contents);

			if (element === scenarioTab && !scenarioToolboxInjected)
			{
				scenarioWorkspace = Blockly.inject("blockly-editor2", { "toolbox": response.toolBox });
				scenarioToolboxInjected = true;
			}

			if (element === entitiesTab && !entitiesToolboxInjected)
			{
				entityWorkspace = Blockly.inject("blockly-editor", { "toolbox": response.toolBox });
				entitiesToolboxInjected = true;
			}
			

			if (entities != undefined) {
				entities.addEventListener("input", onEntityEditorChange);
			}

			if (scenario != undefined) {
				scenario.addEventListener("input", onScenarioEditorChange);
			}

			function onEntityWorkspaceChange(event) {
				var scenarioTabElement = document.getElementById('scenario-tab')

				if (entityWorkspace.getAllBlocks().length > 0) {
					setEnabled(scenarioTabElement);
					enabledByCodeBlocks = true;
				}
				else if (!enabledByText) {
					setDisabled(scenarioTabElement);
					enabledByCodeBlocks = false;
				}

				if (event.type == 'drag' || event.entityCode === 'selected') {
					autoGeneratedEntityBlocks = false;					
				}
				
				if (element === entitiesTab)
					runCodeForEntity(element);
			}

			function onScenarioWorkspaceChange(event) {
				if (event.type == 'drag' || event.entityCode === 'selected') {
					autoGeneratedScenarioBlocks = false;					
				}

				if (element === scenarioTab)
					runCodeForScenario(element);
			}

      		if (entityWorkspace !== undefined) {
				entityWorkspace.addChangeListener(onEntityWorkspaceChange);
			}

      		if (scenarioWorkspace !== undefined) {
				scenarioWorkspace.addChangeListener(onScenarioWorkspaceChange);
			}
		})
}

function filterCategories(element, contents) {
	if (element === entitiesTab) {
		let categories = ["Declarative Scenarios", "Imperative Scenarios"];
		return contents.filter(item => !categories.includes(item.name));
	}
	else if (element === scenarioTab) {
		let categories = ["Declarative Entities", "Imperative Entities"];
		return contents.filter(item => !categories.includes(item.name));
	}
}
function switchToUml() {
    // Hide both editors and their corresponding blockly
    document.getElementById('blockly-editor').style.display = "none";
	document.getElementById('blockly-editor2').style.display = "none";
    // Show the UML container
    umlContainer.style.display = "block";
	loadUMLDiagram();

}
let graph = null;
function enableCanvasPanning(paper) {
    let lastMousePosition = { x: 0, y: 0 };
	const panningMouse = document.getElementById("movePaperMouse");
	const defaultMouse = document.getElementById("defaultMouse");
	let PanningMouseIsSelected = false;
	let isPanning = false;
	panningMouse.addEventListener('click',()=> {
		PanningMouseIsSelected = true;
		panningMouse.classList.add("selected");
		defaultMouse.classList.remove("selected");
		
	})
	defaultMouse.addEventListener('click',()=> {
		PanningMouseIsSelected = false;
		panningMouse.classList.remove("selected");
		defaultMouse.classList.add("selected");
	})
	paper.el.addEventListener('mousedown', (event) => {
		if(PanningMouseIsSelected){
			isPanning = true;
			lastMousePosition = { x: event.clientX, y: event.clientY };
	        paper.el.style.cursor = 'grab'; 
		}
    });
    // Update canvas position as the mouse moves
    paper.el.addEventListener('mousemove', (event) => {
        if (isPanning) {
            const dx = event.clientX - lastMousePosition.x;
            const dy = event.clientY - lastMousePosition.y;
            // Move the paper's viewport
            paper.translate(paper.translate().tx + dx, paper.translate().ty + dy);
            // Update last position for the next move
            lastMousePosition = { x: event.clientX, y: event.clientY };
        }
    });	
    // Stop panning when the mouse is released
    document.addEventListener('mouseup', () => {
        isPanning = false;
        paper.el.style.cursor = 'default'; // Restore cursor
    });
}
function enableCanvasZoom(paper) {
    let currentScale = 1;
    const minScale = 0.2; 
    const maxScale = 2.0; 
    const zoomStep = 0.1;

    paper.el.addEventListener('wheel', (event) => {
        event.preventDefault();
        // Determine the zoom direction
        if (event.deltaY < 0 && currentScale < maxScale) {
            // Zoom in
            currentScale += zoomStep;
        } else if (event.deltaY > 0 && currentScale > minScale) {
            // Zoom out
            currentScale -= zoomStep;
        }
        paper.scale(currentScale);
    });
}
function loadUMLDiagram() {
	if (graph) {
        return; 
    }
        var namespace = joint.shapes;
        graph = new joint.dia.Graph({}, { cellNamespace: namespace });

        var paper = new joint.dia.Paper({
            el: document.getElementById('uml-canvas'),
            model: graph,
            width: "100%",
            height: "100%",
            gridSize: 1,
            drawGrid: true,
        });
		enableCanvasPanning(paper);
		enableCanvasZoom(paper);

        // Handle drag and drop for elements
        const toolbox = document.getElementById('toolbox');
        toolbox.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', event.target.id);
        });

        paper.el.addEventListener('dragover', (event) => {
            event.preventDefault(); // Allow dropping
        });

        paper.el.addEventListener('drop', (event) => {
            event.preventDefault();
            const id = event.dataTransfer.getData('text/plain');
            const position = paper.clientToLocalPoint(event.clientX, event.clientY);

            // Create shapes based on the dragged button
            let cell;
            switch (id) {
                case 'drawCircle':
                    cell = new namespace.standard.Circle({
                        position: { x: position.x, y: position.y },
                        size: { width: 80, height: 80 },
                        attrs: { circle: { fill: '#f6a600' }, text: { text: 'Circle', fill: 'white' } }
                    });
                    break;
                case 'drawSquare':
                    cell = new namespace.standard.Polygon({
                        position: { x: position.x, y: position.y },
                        size: { width: 80, height: 80 },
                        attrs: { polygon: { fill: '#e03c31' }, text: { text: 'Triangle', fill: 'white' } }
                    });
                    break;
            }

            if (cell) {
                graph.addCell(cell);
            }
			exportDiagramAsJSON(graph);
        });
		let sourceElement = null; 
		paper.on('element:pointerclick', function(cellView) {
	        sourceElement = cellView.model;
	        editFigure(sourceElement);
			exportDiagramAsJSON(graph);
			paper.off('cell:pointerclick', arguments.callee);
		});
		document.addEventListener('contextmenu',(event)=> {
			event.preventDefault();
		})
		// Handle right-click to open context menu
		paper.on('cell:contextmenu', function(cellView, event) {
		    event.preventDefault();
			const existingMenu = document.getElementById('contextMenu');
		    if (existingMenu) {
		        existingMenu.remove();
		    }
		    // Store the clicked cell as the source element for potential linking
		    sourceElement = cellView.model;
		    // Display a custom context menu at the mouse position
		    const menu = document.createElement('div');
		    menu.id = 'contextMenu';
		    menu.style.position = 'absolute';
		    menu.style.left = `${event.clientX}px`;
		    menu.style.top = `${event.clientY}px`;
		    menu.style.backgroundColor = '#fff';
		    menu.style.border = '1px solid #ccc';
		    menu.style.padding = '10px';
		    menu.style.zIndex = '1000';
		    // Add "Connect" option to the menu
		    const connectOption = document.createElement('button');
			connectOption.setAttribute('type','button');
		    connectOption.textContent = 'Connect';
		    connectOption.style.cursor = 'pointer';
			const removeOption = document.createElement('button');
			removeOption.setAttribute('type','button');
			removeOption.textContent = 'Remove';
		    removeOption.style.cursor = 'pointer';
			menu.appendChild(connectOption);
			menu.appendChild(removeOption);
		    document.body.appendChild(menu);
		    connectOption.onclick = () => {
		        document.body.removeChild(menu); // Remove the context menu
		        startLinking(sourceElement);
		    };
			removeOption.onclick = () => {
		        sourceElement.remove();
				exportDiagramAsJSON(graph);
		    };
		    document.addEventListener('click', function removeMenu() {
		        if (menu.parentNode) {
		            document.body.removeChild(menu);
		        }
		        document.removeEventListener('click', removeMenu);
		    });
		});
		// Linkto the second element after "Connect" option is selected
		function startLinking(selectedElement) {
		    // Highlight the source element to show linking is active
		    const sourceView = paper.findViewByModel(selectedElement);
		    joint.highlighters.mask.add(sourceView, { selector: 'root' }, 'my-element-highlight', {
		        deep: true,
		        attrs: {
		            'stroke': '#FF4365',
		            'stroke-width': 3
		        }
		    });
		    // Listen for the next click to create a link
		    paper.once('cell:pointerclick', function(targetView) {
		        if (targetView.model !== selectedElement) {
		            // Create and add the link between source and target elements
		            const link = new joint.shapes.standard.Link();
		            link.source(selectedElement);
		            link.target(targetView.model);
		            link.addTo(graph);
		            // Remove highlighting from the source element
		            joint.dia.HighlighterView.remove(sourceView, 'my-element-highlight');
		            sourceElement = null; // Reset the source element
		        } else {
		            // Remove highlighting if the same element is clicked again
		            joint.dia.HighlighterView.remove(sourceView, 'my-element-highlight');
		            sourceElement = null;
		        }
		        exportDiagramAsJSON(graph); // Export the updated diagram
				paper.off('cell:pointerclick', arguments.callee);
		    });
		}
	function editFigure(selectedElement){
		let colorPicker = document.getElementById('fillColorPicker');
		let strokeColorPicker = document.getElementById('strokeColorPicker');
		let textAreaInput = document.getElementById('textAreaInput');  
		let textColorPicker = document.getElementById('textColorPicker');
		let strokeWidth = document.getElementById('strokeWidth');
		let widthSize = document.getElementById('widthSize');
		let heightSize = document.getElementById('heightSize');
		let rotation = document.getElementById('rotation');
		// Remove previous listeners by cloning each input
	    function removeListeners(input) {
	        const newInput = input.cloneNode(true);
	        input.replaceWith(newInput);
	        return newInput;
	    }
	    // Replace each input to clear previous listeners
	    colorPicker = removeListeners(colorPicker);
	    strokeColorPicker = removeListeners(strokeColorPicker);
	    textAreaInput = removeListeners(textAreaInput);
		textColorPicker = removeListeners(textColorPicker);
	    strokeWidth = removeListeners(strokeWidth);
	    widthSize = removeListeners(widthSize);
	    heightSize = removeListeners(heightSize);
	    rotation = removeListeners(rotation);
		
		colorPicker.value = selectedElement.attr('body/fill') || '#000000';
		strokeColorPicker.value = selectedElement.attr('body/stroke') || '#000000';
		textAreaInput.value = selectedElement.attr('label/text') || '';
		textColorPicker.value = selectedElement.attr('label/fill') || '#000000';
		strokeWidth.value = selectedElement.attr('body/strokeWidth') || 2;
		widthSize.value = selectedElement.size().width || 80;
		heightSize.value = selectedElement.size().height || 80;
		rotation.value = selectedElement.angle() || 0;
		colorPicker.addEventListener('input',function (event) {
			if (selectedElement) {
			    selectedElement.attr('body/fill', event.target.value);
    		}
		})
		strokeColorPicker.addEventListener('input',function (event) {
			if (selectedElement) {
			    selectedElement.attr('body/stroke', event.target.value);
    		}
		})
		textAreaInput.addEventListener('input',function (event) {
			if (selectedElement) {
				selectedElement.attr({
				    label: {
				        text: event.target.value,
				        'font-size': 12,
				        'text-anchor': 'middle',
				        'text-vertical-anchor': 'middle',
				        'ref-y': 0.5,
				        'y-alignment': 'middle',
				        'white-space': 'pre-wrap'
				    }
				});
			}
			exportDiagramAsJSON(graph);
		})
		textColorPicker.addEventListener('input', (event) => {
			if (selectedElement) {
				selectedElement.attr('label/fill', event.target.value);
			}
	    });
		strokeWidth.addEventListener('input', function(event) {
		    if (selectedElement) {
		        selectedElement.attr('body/strokeWidth', event.target.value);
		    }
		});
		widthSize.addEventListener('input', function(event) {
		    if (selectedElement) {
		        selectedElement.resize(parseInt(event.target.value), selectedElement.size().height);
		    }
		});
		heightSize.addEventListener('input', function(event) {
		    if (selectedElement) {
		        selectedElement.resize(selectedElement.size().width, parseInt(event.target.value));
		    }
		});
		rotation.addEventListener('input', function(event) {
		    if (selectedElement) {
		        selectedElement.rotate(parseInt(event.target.value));
		    }
		});
	}
}
function exportDiagramAsJSON(graph) {
    const json = graph.toJSON();
    const jsonString = JSON.stringify(json, null, 2); // Pretty-print with indentation
    console.log(jsonString);
    return jsonString; 
}
function switchToBlock() {
	if(currentTab.id== "entity-tab"){
		document.getElementById('blockly-editor').style.display = "block";
	}
	else if(currentTab.id== "scenario-tab"){
		document.getElementById('blockly-editor2').style.display = "block";
	}
    umlContainer.style.display = "none";
}

function saveScenario() {
  // Get the current scenario content from the appropriate editor
  const editor = getCurrentAceEditor(); // Assuming this function gets the active Ace editor
  const scenarioContent = editor.getValue(); // Get the content from the editor

  // Send the content to the server-side servlet for saving
  fetch('/save-scenario', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // Specify the content type as JSON
    },
    body: JSON.stringify({ content: scenarioContent }), // Send the scenario content as JSON
  }).then(response => {
    if (response.ok) {
      alert('Scenario saved successfully!'); // Notify the user of success
    } else {
      alert('Error saving scenario.'); // Notify the user of an error
    }
  }).catch(error => {
    console.error('Error:', error); // Log any network errors
    alert('An error occurred while saving the scenario.'); // Notify the user of an error
  });
}


function saveEntities() {
  // Get the current scenario content from the appropriate editor
  const editor = getCurrentAceEditor(); // Assuming this function gets the active Ace editor
  const scenarioContent = editor.getValue(); // Get the content from the editor

  // Send the content to the server-side servlet for saving
  fetch('/save-entities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // Specify the content type as JSON
    },
    body: JSON.stringify({ content: scenarioContent }), // Send the scenario content as JSON
  }).then(response => {
    if (response.ok) {
      alert('Entities saved successfully!'); // Notify the user of success
    } else {
      alert('Error saving entities.'); // Notify the user of an error
    }
  }).catch(error => {
    console.error('Error:', error); // Log any network errors
    alert('An error occurred while saving the entities.'); // Notify the user of an error
  });
}


function runScenario() {
  fetch('/run-scenario', {
    method: 'POST',
  }).then(response => {
    if (response.ok) {
      alert('Scenario running...');
    } else {
      alert('Error running scenario.');
    }
  });
}

function runExampleUml(){
	var namespace = joint.shapes;

	        var graph = new joint.dia.Graph({}, { cellNamespace: namespace });

	        var paper = new joint.dia.Paper({
	            el: document.getElementById('xtext-editor-diagrams'),
	            model: graph,
	            width: 800,
	            height: 800,
	            gridSize: 1,
	            cellViewNamespace: namespace
	        });

	        var rect = new joint.shapes.standard.Rectangle();
	        rect.position(100, 30);
	        rect.resize(100, 40);
	        rect.attr({
	            body: {
	                fill: 'blue'
	            },
	            label: {
	                text: 'Hello',
	                fill: 'white'
	            }
	        });
	        rect.addTo(graph);

	        var rect2 = rect.clone();
	        rect2.translate(300, 0);
	        rect2.attr('label/text', 'World!');
	        rect2.addTo(graph);

	        var link = new joint.shapes.standard.Link();
	        link.source(rect);
	        link.target(rect2);
	        link.addTo(graph);
}


