package dk.sdu.bdd.xtext.web.services;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.File;

@WebServlet("/save-uml")
public class SaveUmlServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // Read the JSON content from the request body
        StringBuilder content = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line);
            }
        }
        String umlContent = content.toString();
        if (!isValidJson(umlContent)) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("Invalid JSON format");
            return;
        }
        String rootPath = getServletContext().getRealPath("/");

        String relativePath = "../../dk.sdu.bdd.xtext.examples/src/dk/sdu/bdd/xtext/examples/uml_data.json";
        String absoluteFilePath = new File(rootPath, relativePath).getCanonicalPath();

        try (FileWriter fileWriter = new FileWriter(absoluteFilePath)) {
            fileWriter.write(umlContent);
        } catch (IOException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("Error saving UML data");
            return;
        }

        response.setStatus(HttpServletResponse.SC_OK);
        response.getWriter().write("UML data saved successfully");
    }
    private boolean isValidJson(String json) {
        try {
            new JSONObject(json);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
