package dk.sdu.bdd.xtext.web.services.uml;

import java.util.ArrayList;
import java.util.List;

public class UML {
    private String output;
    private String id;
    private String type;
    private String label;
    private String category;
    // private List<UMLLink> links;

    public UML(String type) {
        // this.id = id;
        this.type = type;
        // this.label = label;
        this.category = determineCategory(type);
        // this.links = new ArrayList<>();
    }

    public String getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getLabel() {
        return label;
    }

    public String getCategory() {
        return category;
    }

    /*
     * public List<UMLLink> getLinks() {
     * return links;
     * }
     * 
     * public void addLink(UMLLink link) {
     * this.links.add(link);
     * }
     */
    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }

    private String determineCategory(String type) {
        switch (type) {
            case "standard.Rectangle":
                return "Model";
            case "standard.Ellipse":
                return "Declarative Entities";
            case "standard.Link":
                return "Declarative Scenarios";
            default:
                return "General";
        }
    }
}
