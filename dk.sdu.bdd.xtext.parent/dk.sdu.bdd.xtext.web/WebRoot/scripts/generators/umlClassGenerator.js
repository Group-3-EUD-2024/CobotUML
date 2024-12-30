// JsonObj to keep track of parrent children
var cellsRelationJson = {};

// Array of cells to add
var cellsToAdd = [];

// Function to recursively create JointJS cells from AST nodes
function createJointjsCells(root, umlWorkspace) {	
	// Return if ast is empty
	if (!root || !root._children)
		return "No children";
	
	// Reset globals
	cellsRelationJson = {};
	cellsToAdd = [];
	
	var parrentObj = null;
	
	recursiveLoopNodes(root, umlWorkspace, parrentObj);
	
	console.log(cellsRelationJson);
	
	addCellsToList(cellsRelationJson);
	
	for (var i = 0; i < cellsToAdd.length; i++) {
		umlWorkspace.addCell(cellsToAdd[i]);
	}
}

function recursiveLoopNodes(root, parrentObj) {
	// Get a bool value for if the root ast contains an array
	var childrenIsArray = Array.isArray(root._children);
	
	// Loop to get the first children nodes
	for (var i = 0; i < (childrenIsArray ? root._children.length : 1); i++) {

		// Get current node if any exists
		var current = childrenIsArray ? root._children[i]._children : root._children;
		
		// If a node exists continue.
		if (!current)
			continue;
		
		var currentParrentObj = parrentObj;
		
		// Check if the node has a value
		if (current.value) {
			// console.log('Current value: ' + current.value._value);
			
			var parsedObj = parseValueString(current.value._value);
			// console.log('Current Type: ' + parsedObj.type);
			// console.log('Current id: ' + parsedObj.id);
			
			var newParrent = createJsonRelationObj(parsedObj, parrentObj);
		
			// Set new parrent only if the current node has children
			if (current.nodes) {
				currentParrentObj = newParrent;
			}
		}
		
		// Check if the current node has any sub nodes (children)
		if (current.nodes) {			
			// If it has run this function again with the current node as the root node.
			recursiveLoopNodes(current.nodes, currentParrentObj);
		}
	}
}

function createJsonRelationObj(parsedObj, parrentObj) {	
	if (parrentObj != null) {
		var formatedParrentObj = parrentObj.id + " (" + parrentObj.type + ")";
		
		if (cellsRelationJson[formatedParrentObj] == null) {
			cellsRelationJson[formatedParrentObj] = [];	
		}
		
		cellsRelationJson[formatedParrentObj].push(parsedObj.id + " (" + parsedObj.type + ")");
	}
	
	return parsedObj;
}

function addCellsToList(cellsRelationJson) {
	
	let cell;
	
	for (const parrent in cellsRelationJson) {
		if (!parrent.includes("undefined")) {
			cell = new joint.shapes.standard.HeaderedRectangle();
			cell .resize(225, 100);
			cell .position(200, 100);
			cell .attr('root/title', 'shapes.standard.HeaderedRectangle');
			cell .attr('header/fill', 'lightgray');
			
			cell .attr('headerText/text', parrent);
			
			var bodyText = "";
			
			for (const child in cellsRelationJson[parrent]) {
				bodyText += cellsRelationJson[parrent][child] + "\n";
			}
			
			cell .attr('bodyText/text', bodyText);
			
			console.log(`${parrent}: ${cellsRelationJson[parrent]}`);

			cellsToAdd.push(cell);
		}
	}
}
