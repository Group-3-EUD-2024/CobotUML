function generateUMLClassFromAst(ast, workspace, tabName) {
    if (!workspace || !ast || !ast._children)
        return;
    
    workspace.clear();

    if (tabName === 'entities' && ast._children.length > 0)
    {
        generateBlocks(ast._children[ast._children.length - 1], workspace, null); // entities are here
    }

    if (tabName === 'scenarios' && ast._children.length > 1)
    {
        generateBlocks(ast._children[0], workspace, null); // scenarios are here
    }

    workspace.render();
}

function generateClassUML(root, workspace, parentClassUML) {
	if (!root || !root._children)
	        return;

	var childrenIsArray = Array.isArray(root._children);
	
	// sometimes we need to reverse the order.
    if (childrenIsArray && (parentClassUML.type === 'Model' 
        || parentClassUML.type === 'DeclarativeEntityDef')) {
        root._children.reverse();
    }
	
	for (var i = 0; i < (childrenIsArray ? root._children.length : 1); i++) {
        var current = childrenIsArray ? root._children[i]._children : root._children;
        if (!current)
            continue;

        var currentParentClassUML = null;

        if (current.value) {
            console.log('Current value: ' + current.value._value);

            var parsedObj = parseValueString(current.value._value);    
            if (parsedObj && parsedObj.type) {
                var addedClassUML = addClassUMLToWorkspace(parsedObj, workspace, parentClassUML); 
                currentParentClassUML = addedClassUML ? addedClassUML : parentClassUML;
            }
            else
            {
                currentParentClassUML = parentClassUML;
            }
        }

        if (current.nodes) {
            generateClassUML(current.nodes, workspace, currentParentClassUML);
        }
    }
}

function addClassUMLToWorkspace(parsedObj, workspace, parentBlock) {
    var blockToAdd = null;

    // Keep track of what part of the scenario we are working on.
    // This is because we need to know where to add the 'And' blocks.
    if (parsedObj.type === 'DeclarativeScenarioState') {
        if (currentScenarioComponent === 'when') 
            currentScenarioComponent = 'then';
    }
    else if (parsedObj.type === 'DeclarativeScenarioAction') {
        if (currentScenarioComponent === 'given') 
            currentScenarioComponent = 'when';
    }

    // we have special cases: DeclarativeEntityRef, ActionRef, PropertyRef etc.
    // they require special blocks to be connected.
    if (parsedObj.type === 'DeclarativeEntityRef') {
        // we have to check if the dropdown field value of the parent block is empty.
        // because we need to add different blocks according to that
        var dropdownField = parentBlock.getFieldValue('alternativs'); // Get the dropdown field by its name

        if (parentBlock.tooltip !== 'DeclarativeEntityAction' || dropdownField !== ' ') {
            addIdBlock(parsedObj.id, parentBlock, workspace, false);
            addValueBlock(parsedObj.entityValue, parentBlock, workspace);
        }
        else if (isFirstDeclarativeEntityRefForDeclarativeEntityAction) {
            addIdBlock(parsedObj.id, parentBlock, workspace, false);
            addValueBlock(parsedObj.entityValue, parentBlock, workspace);
            isFirstDeclarativeEntityRefForDeclarativeEntityAction = false;
        }
        else if (!isFirstDeclarativeEntityRefForDeclarativeEntityAction){
            blockToAdd = workspace.newBlock('DeclarativeEntityRef');
            addIdBlock(parsedObj.id, blockToAdd, workspace, false);
            addValueBlock(parsedObj.entityValue, blockToAdd, workspace);

            if (parentBlock)
                addParentBlock(parentBlock, blockToAdd, workspace);

            workspace.getBlockById(blockToAdd.id).initSvg();
            isFirstDeclarativeEntityRefForDeclarativeEntityAction = true; // reset
        }

        return parentBlock;
    }
    else if (parsedObj.type === 'PropertyRef' 
        && (parentBlock.tooltip === 'DeclarativeEntityPropertyAction' || parentBlock.tooltip === 'DeclarativeEntityStatePhraseWithProperty')) {
        addIdBlock(parsedObj.id, parentBlock, workspace, false);
        addValueBlock(parsedObj.propertyValue, parentBlock, workspace);
        return parentBlock;
    }
    else if (parsedObj.type === 'ActionRef') {
        addIdBlock(parsedObj.id, parentBlock, workspace, false);
        return parentBlock;
    }   
    else if (parsedObj.type === 'DeclarativeEntityOrPropertyRef') {
        blockToAdd = workspace.newBlock('subBlock_DeclarativeEntityAction');
        addIdBlock(parsedObj.id, blockToAdd, workspace, false);
        addValueBlock(parsedObj.propertyValue, blockToAdd, workspace);

        if (parentBlock)
            addParentBlock(parentBlock, blockToAdd, workspace);
        
        workspace.getBlockById(blockToAdd.id).initSvg();

        return parentBlock;
    }
    else if (parsedObj.type === 'DeclarativeScenarioStateAnd') {
        blockToAdd = workspace.newBlock("subBlock_Scenario_And"); 
    }
    else if (parsedObj.type === 'DeclarativeScenarioActionAnd') {
        blockToAdd = workspace.newBlock("subBlock_Scenario_And0");
    }

    var blockDefinition = blockDefinitions.find(function(b) {
        return b.type === parsedObj.type;
    });

    if (blockDefinition) { // good. we know this block
        blockToAdd = workspace.newBlock(parsedObj.type);
    }
    else if (!blockToAdd) { // blocks that should be handled separately
        var substringToSearch = null;

        switch (parsedObj.type)
        {
            case 'PropertyDef':
            case 'ImperativePropertyDef':              
                substringToSearch = "properties";
                break;
            case 'ActionDef':
            case 'ImperativeActionDef':
                substringToSearch = "actions";
                break;
            case 'StateName':
            case 'ImperativeStateName':
                substringToSearch = "states";
                break;
            default:
                console.log("Can't add the block with type: " + parsedObj.type);
                return null;
        }

        if (!substringToSearch)
            return null;

        var parentBlockDefinition = blockDefinitions.find(function(b) {
            return b.type === parentBlock.type;
        });
        
        try { // try to add the input to the correct place
            var previousBlockDefinition = null;  
            var inputArgument = null;  

            if (previousBlock) // connect as a subblock
            {
                previousBlockDefinition = blockDefinitions.find(function(b) {
                    return b.type === previousBlock.type;
                });

                inputArgument = previousBlockDefinition.args0.find(function(a) {
                    return a.check && a.check.some(function(checkItem) {
                        return (checkItem.includes(substringToSearch) && 
                            !checkItem.startsWith("subBlock_subBlock_subBlock"));
                    }) && a.type === 'input_statement';
                });

                if (!inputArgument) { // try going to the outer level
                    previousBlock = previousBlock.getPreviousBlock();

                    previousBlockDefinition = blockDefinitions.find(function(b) {
                        return b.type === previousBlock.type;
                    });
    
                    inputArgument = previousBlockDefinition.args0.find(function(a) {
                        return a.check && a.check.some(function(checkItem) {
                            return (checkItem.includes(substringToSearch) && 
                                !checkItem.startsWith("subBlock_subBlock_subBlock"));
                        }) && a.type === 'input_statement';
                    });
                }
            }

            if (inputArgument) // means we are connecting to the previous block as subblock
            {
                parentBlock = previousBlock;
            }
            else // means we have to connect to the parent instead
            {
                inputArgument = parentBlockDefinition.args0.find(function(a) {
                    return a.check && a.check.some(function(checkItem) {
                        return checkItem.includes(substringToSearch);
                    }) && a.type === 'input_statement';
                });
            }
            
            var blockType = inputArgument.check.find(function(c) {
                return (c.includes(substringToSearch));
            });

            // manual intervention for wrong types
            if (blockType === `subBlock_subBlock_DeclarativeEntityDef_${substringToSearch}:`)
            {
                blockType = `subBlock_subBlock_DeclarativeEntityDef_${substringToSearch}:_,`;
            }

            if (blockType === `subBlock_subBlock_ImperativeEntityDef_${substringToSearch}:` ||
                blockType === `subBlock_subBlock_ImperativeEntityDef_${substringToSearch}:_/` ||
                blockType === `subBlock_subBlock_ImperativeEntityDef_${substringToSearch}:_[_]`)
            {
                blockType = `subBlock_subBlock_ImperativeEntityDef_${substringToSearch}:_,`;   
            }

            blockToAdd = workspace.newBlock(blockType);
        }
        catch(e) {
            console.log(e);
        }
    }

    if (!blockToAdd)
        return null;

    if (parsedObj.reference === 'StateName' && 
        (parsedObj.type === 'DeclarativeEntityStatePhraseWithProperty' || parsedObj.type === 'DeclarativeEntityStatePhrase')) // fix the order manually
        addIdBlock(parsedObj.id, blockToAdd, workspace, true);
    else if (parsedObj.id)
        addIdBlock(parsedObj.id, blockToAdd, workspace, false);

    if (parsedObj.scenarioName)
        addStringBlock(parsedObj.scenarioName, blockToAdd, workspace);

    if (parsedObj.strValue)
        addStringBlock(parsedObj.strValue, blockToAdd, workspace);

    if (parsedObj.preposition)
        setDropdownValue(parsedObj.preposition, blockToAdd, workspace, false);

    if (parsedObj.preposition2)
        setDropdownValue(parsedObj.preposition2, blockToAdd, workspace, true);

    if (parsedObj.toBeWord)
        setDropdownValue(parsedObj.preposition3, blockToAdd, workspace, false);

    if (parsedObj.preposition3)
        setDropdownValue(parsedObj.preposition3, blockToAdd, workspace, false); 

    if (parentBlock)
        addParentBlock(parentBlock, blockToAdd, workspace);

    previousBlock = blockToAdd;

    workspace.getBlockById(blockToAdd.id).initSvg();
    return blockToAdd;
}

