function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("theme", theme);
}
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
	document.body.classList.toggle("dark-mode");
 }
 const lightDarkButton = document.querySelector(".theme-toggle-btn");
  if (lightDarkButton) {
    lightDarkButton.addEventListener("click", toggleTheme);
  }
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
		else if (editorId == "xtext-editor-diagrams") { b = "uml-editor"}
		
		console.log(editorId)
		let editor = document.getElementById(editorId)
		let blockly = document.getElementById(b)
		displayEditor(currentEditor, editor, currentBlockly, blockly)
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
	element.style.border = "2px white solid";
}

function removeSelectionBorder(element) {
	element.style.border = "2px black solid"
}

function setDisabled(element) {
	element.style.pointerEvents = "none";
	element.disabled = true;
	warningMessage.style.visibility = "visible";
}

function setEnabled(element) {
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
		
		loadCustomShapes();
		
		enableCanvasPanning(paper);
		enableCanvasZoom(paper);
		let ghostEl;
        // Handle drag and drop for elements
        const toolbox = document.getElementById('toolbox');
		const editContainer = document.getElementById('element_settings_container');
		editContainer.style.display = 'none'

        toolbox.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', event.target.id);
			// Create a ghost element to follow the mouse
			ghostEl = event.target.cloneNode(true);
			ghostEl.classList.add("ghost");
			document.body.appendChild(ghostEl);
			console.log(ghostEl);
			event.dataTransfer.setDragImage(ghostEl, ghostEl.offsetWidth / 2, ghostEl.offsetHeight / 2);
        });

		toolbox.addEventListener('dragend', (event) => {
			document.body.removeChild(ghostEl);
		});

        paper.el.addEventListener('dragover', (event) => {
            event.preventDefault(); // Allow dropping
        });

        paper.el.addEventListener('drop', (event) => {
            event.preventDefault();
            const id = event.dataTransfer.getData('text/plain');
			console.log(id);
            const position = paper.clientToLocalPoint(event.clientX, event.clientY);

            // Create shapes based on the dragged button
            let cell;
			switch (id) {
				case 'drawModel':
					cell = new namespace.noteditable.model({
						position: { x: position.x, y: position.y },
						size: { width: 80, height: 40 },
						attrs: {
							polygon: { fill: '#f6a600' },
							label: { text: 'Model', fill: '#000000' }
						}
					});
					break;
				case 'drawImperativeEntity':
					cell = new namespace.noteditable.imperativeEntity({
						position: { x: position.x, y: position.y },
						size: { width: 120, height: 40 },
						attrs: {
							polygon: { fill: '#f6a600' },
							label: { text: 'Imperative Entity', fill: '#000000' }
						}
					});
					break;
				case 'drawProperties':
					cell = new namespace.noteditable.properties({
						position: { x: position.x, y: position.y },
						size: { width: 120, height: 40 },
						attrs: {
							polygon: { fill: '#f6a600' },
							label: { text: 'Properties', fill: '#000000' }
						}
					});
					break;
				case 'drawStates':
					cell = new namespace.noteditable.states({
						position: { x: position.x, y: position.y },
						size: { width: 120, height: 40 },
						attrs: {
							polygon: { fill: '#f6a600' },
							label: { text: 'States', fill: '#000000' }
						}
					});
					break;
				case 'drawID':
					cell = new namespace.editable.id({
						position: { x: position.x, y: position.y },
						size: { width: 120, height: 40 },
						attrs: {
							polygon: { fill: '#f6a600' },
							label: { text: 'Enter ID...', fill: '#000000' }
						}
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
			
			console.log(sourceElement.attributes.type);
			console.log(sourceElement.attributes.type.includes("editable"));
			if (sourceElement.attributes.type.includes("noteditable") == true) {
				editContainer.style.display = 'none';
			} else {
				editContainer.style.display = 'flex';
				editFigure(sourceElement);
			}
			
			exportDiagramAsJSON(graph);
			paper.off('cell:pointerclick', arguments.callee);
		});
		paper.on('link:pointerclick', function(linkView) {
		    const clickedLink = linkView.model;
		    console.log("Link clicked:", clickedLink);
			editLink(clickedLink);
		    exportDiagramAsJSON(graph);
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
		
	function editLink(selectedLink){
		let colorPicker = document.getElementById('fillColorPicker');
		const colorPickerLabel = document.querySelector('label[for="fillColorPicker"]');
		let strokeColorPicker = document.getElementById('strokeColorPicker');
		const strokeColorPickerLabel = document.querySelector('label[for="strokeColorPicker"]');
		let textAreaInput = document.getElementById('textAreaInput'); 
		const textAreaInputLabel = document.querySelector('label[for="textAreaInput"]'); 
		let textColorPicker = document.getElementById('textColorPicker');
		const textColorPickerLabel = document.querySelector('label[for="textColorPicker"]');
		const routerTypeLabel = document.querySelector('label[for="routerType"]'); 
	    let connectorType = document.getElementById('connectorType');
		const connectorTypeLabel = document.querySelector('label[for="connectorType"]');
		let linkShape = document.getElementById('linkShape');
		const linkShapeLabel = document.querySelector('label[for="linkShape"]');
		routerType.style.display = 'block';
		routerTypeLabel.style.display = 'block';
		connectorType.style.display = 'block';
		connectorTypeLabel.style.display = 'block';
		linkShape.style.display = 'block';
		linkShapeLabel.style.display = 'block'
		
		// Remove previous listeners by cloning each input
	    function removeListeners(input) {
	        const newInput = input.cloneNode(true);
	        input.replaceWith(newInput);
	        return newInput;
	    }
		// Replace each input to clear previous listeners
	    colorPicker = removeListeners(colorPicker);
	    textAreaInput = removeListeners(textAreaInput);
		textColorPicker = removeListeners(textColorPicker);
		routerType = removeListeners(routerType);
	 	connectorType = removeListeners(connectorType);
		linkShape = removeListeners(linkShape);
		
		colorPicker.value = selectedLink.attr('line/fill') || '#000000';
		textAreaInput.value = selectedLink.labels()[0]?.attrs.text.text || '';
		textColorPicker.value = selectedLink.attr('label/fill') || '#000000';
		routerType.value = selectedLink.get('router')?.name || 'normal';
	   connectorType.value = selectedLink.get('connector')?.name || 'normal';
	   linkShape.value = selectedLink.attributes.type || 'standard.Link';
		colorPicker.addEventListener('input',function (event) {
			if (selectedLink) {
			    selectedLink.attr('line/stroke', event.target.value);
    		}
		})
		textAreaInput.addEventListener('input',function (event) {
			if (selectedLink) {
				selectedLink.label(0, {
	                attrs: {
	                    text: {
	                        text: event.target.value,
	                        'font-size': 12, 
	                        'text-anchor': 'middle',
	                        'y-alignment': 'middle'
	                    }
	                },
	                position: 0.5 // Position in the middle of the link
	            });
			}
			exportDiagramAsJSON(graph);
		})
		textColorPicker.addEventListener('input', (event) => {
			if (selectedLink) {
				selectedLink.label(0, {
	                attrs: {
	                    text: {
	                        fill: event.target.value,
	                        'font-size': 12, 
	                        'text-anchor': 'middle',
	                        'y-alignment': 'middle'
	                    }
	                },
	                position: 0.5 // Position in the middle of the link
	            });
			}
	    });
		routerType.addEventListener('change', function(event) {
	        if (selectedLink) {
	            selectedLink.router(event.target.value);
	        }
	    });
	    connectorType.addEventListener('change', function(event) {
	        if (selectedLink) {
	            selectedLink.connector(event.target.value, { cornerType: 'line' });
	        }
	    });
		linkShape.addEventListener('change',function(event){
				const newShapeType = event.target.value; 
				let newLink = null;
				switch(event.target.value){
					case "standard.Link":
						newLink = new namespace.standard.Link;
						break;
					case "standard.DoubleLink":
						newLink = new namespace.standard.DoubleLink;
						break;
					case "standard.ShadowLink":
						newLink = new namespace.standard.ShadowLink;
						break;
				}
			    // Update source and target for the new link
			    newLink.source(selectedLink.source());
			    newLink.target(selectedLink.target());
				// Copy all attributes from the old link to the new link
	            copyAttributes(selectedLink, newLink);
				// Remove the old link from the graph
				graph.getCell(selectedLink.id).remove();
				graph.addCell(newLink);
				selectedLink = newLink;
		})
		function copyAttributes(oldLink, newLink) {
		        newLink.attr('line/stroke', oldLink.attr('line/stroke'));
		        const labelAttrs = oldLink.labels()[0]?.attrs.text;
		        if (labelAttrs) {
		            newLink.label(0, {
		                attrs: {
		                    text: {
		                        text: labelAttrs.text,
		                        fill: labelAttrs.fill,
		                        'font-size': labelAttrs['font-size'],
		                        'text-anchor': labelAttrs['text-anchor'],
		                        'y-alignment': labelAttrs['y-alignment']
		                    }
		                },
		                position: 0.5
		            });
		        }
		        newLink.router(oldLink.get('router'));
		        newLink.connector(oldLink.get('connector'));
		    }
	}
	
	function editFigure(selectedElement){
		let colorPicker = document.getElementById('fillColorPicker');
		const colorPickerLabel = document.querySelector('label[for="fillColorPicker"]');
		let strokeColorPicker = document.getElementById('strokeColorPicker');
		const strokeColorPickerLabel = document.querySelector('label[for="strokeColorPicker"]');
		let textAreaInput = document.getElementById('textAreaInput'); 
		const textAreaInputLabel = document.querySelector('label[for="textAreaInput"]'); 
		let textColorPicker = document.getElementById('textColorPicker');
		const textColorPickerLabel = document.querySelector('label[for="textColorPicker"]');
		let routerType = document.getElementById('routerType'); 
		const routerTypeLabel = document.querySelector('label[for="routerType"]'); 
	    let connectorType = document.getElementById('connectorType');
		const connectorTypeLabel = document.querySelector('label[for="connectorType"]');
		let linkShape = document.getElementById('linkShape');
		const linkShapeLabel = document.querySelector('label[for="linkShape"]');
		routerType.style.display = 'none';
		routerTypeLabel.style.display = 'none';
		connectorType.style.display = 'none';
		connectorTypeLabel.style.display = 'none';
		linkShape.style.display = 'none';
		linkShapeLabel.style.display = 'none';
		if (selectedElement.attributes.type == "standard.HeaderedRectangle") {
			textColorPicker.style.display = 'none';
			textColorPickerLabel.style.display = 'none';
		}else{
			textColorPicker.style.display = 'block';
			textColorPickerLabel.style.display = 'block';
		}
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
		
		colorPicker.value = selectedElement.attr('body/fill') || '#000000';
		strokeColorPicker.value = selectedElement.attr('body/stroke') || '#000000';
		textAreaInput.value = selectedElement.attributes.type == "standard.HeaderedRectangle" && selectedElement.attr('headerText/text') + "\n" + selectedElement.attr('bodyText/text') || selectedElement.attr('label/text') || '';
		textColorPicker.value = selectedElement.attr('label/fill') || '#000000';
		
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
			if(selectedElement.attributes.type == "standard.HeaderedRectangle"){
				const text = event.target.value ;
				    
				    // Check if there's a newline character
				    if (text.includes('\n')) {
				        // Split text at the first newline character
				        const [firstPart, ...rest] = text.split('\n');
				        const secondPart = rest.join('\n'); // Join rest
				        let part1 = firstPart;
				        let part2 = secondPart;
						selectedElement.attr('headerText/text',part1);
						selectedElement.attr('bodyText/text',part2);						
				    }
			}
			else {
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
	}
}

function exportDiagramAsJSON(graph) {
    const json = graph.toJSON();
    const jsonString = JSON.stringify(json, null, 2); // Pretty-print with indentation
    console.log(jsonString);
    return jsonString; 
}

function loadCustomShapes() {
	
	// Model shape
	joint.dia.Element.define('noteditable.model', {
	    attrs: {
	        body: {
	            width: 'calc(w)',
	            height: 'calc(h)',
	            strokeWidth: 2,
	            stroke: '#000000',
	            fill: '#FFFFFF'
	        },
	        label: {
	            textVerticalAnchor: 'middle',
	            textAnchor: 'middle',
	            x: 'calc(0.5*w)',
	            y: 'calc(0.5*h)',
	            fontSize: 14,
	            fill: '#333333'
	        }
	    }
	}, {
	    markup: [{
	        tagName: 'rect',
	        selector: 'body',
	    }, {
	        tagName: 'text',
	        selector: 'label'
	    }]
	});
	
	// Imperative Entity shape
	joint.dia.Element.define('noteditable.imperativeEntity', {
	    attrs: {
	        body: {
	            width: 'calc(w)',
	            height: 'calc(h)',
	            strokeWidth: 2,
	            stroke: '#000000',
	            fill: '#FFFFFF'
	        },
	        label: {
	            textVerticalAnchor: 'middle',
	            textAnchor: 'middle',
	            x: 'calc(0.5*w)',
	            y: 'calc(0.5*h)',
	            fontSize: 14,
	            fill: '#333333'
	        }
	    }
	}, {
	    markup: [{
	        tagName: 'rect',
	        selector: 'body',
	    }, {
	        tagName: 'text',
	        selector: 'label'
	    }]
	});
		
	// State shape
	joint.dia.Element.define('noteditable.states', {
	    attrs: {
	        body: {
	            width: 'calc(w)',
	            height: 'calc(h)',
	            strokeWidth: 2,
	            stroke: '#000000',
	            fill: '#FFFFFF'
	        },
	        label: {
	            textVerticalAnchor: 'middle',
	            textAnchor: 'middle',
	            x: 'calc(0.5*w)',
	            y: 'calc(0.5*h)',
	            fontSize: 14,
	            fill: '#333333'
	        }
	    }
	}, {
	    markup: [{
	        tagName: 'rect',
	        selector: 'body',
	    }, {
	        tagName: 'text',
	        selector: 'label'
	    }]
	});
	
	// State shape
	joint.dia.Element.define('noteditable.properties', {
	    attrs: {
	        body: {
	            width: 'calc(w)',
	            height: 'calc(h)',
	            strokeWidth: 2,
	            stroke: '#000000',
	            fill: '#FFFFFF'
	        },
	        label: {
	            textVerticalAnchor: 'middle',
	            textAnchor: 'middle',
	            x: 'calc(0.5*w)',
	            y: 'calc(0.5*h)',
	            fontSize: 14,
	            fill: '#333333'
	        }
	    }
	}, {
	    markup: [{
	        tagName: 'rect',
	        selector: 'body',
	    }, {
	        tagName: 'text',
	        selector: 'label'
	    }]
	});
		
	// insert ID shape
	joint.dia.Element.define('editable.id', {
	    attrs: {
	        body: {
	            width: 'calc(w)',
	            height: 'calc(h)',
	            strokeWidth: 2,
	            stroke: '#000000',
	            fill: '#FFFFFF'
	        },
	        label: {
	            textVerticalAnchor: 'middle',
	            textAnchor: 'middle',
	            x: 'calc(0.5*w)',
	            y: 'calc(0.5*h)',
	            fontSize: 14,
	            fill: '#333333'
	        }
	    }
	}, {
	    markup: [{
	        tagName: 'rect',
	        selector: 'body',
	    }, {
	        tagName: 'text',
	        selector: 'label'
	    }]
	});
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


