package com.bookstore.project.service;

import com.bookstore.project.model.Book;
import com.bookstore.project.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.json.JSONArray;
import org.json.JSONObject;

@Service
public class GoogleBooksService {

    @Autowired
    private BookRepository bookRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String API_URL =
        "https://www.googleapis.com/books/v1/volumes?q=%s&maxResults=40&langRestrict=en";

    public int fetchAndSave(String query) {
        String url = String.format(API_URL, query.replace(" ", "+"));
        String response = restTemplate.getForObject(url, String.class);
        JSONObject json = new JSONObject(response);
        JSONArray items = json.optJSONArray("items");
        if (items == null) return 0;

        int saved = 0;
        for (int i = 0; i < items.length(); i++) {
            try {
                JSONObject volumeInfo = items.getJSONObject(i).getJSONObject("volumeInfo");
                JSONObject saleInfo = items.getJSONObject(i).optJSONObject("saleInfo");

                String isbn = extractIsbn(volumeInfo);
                if (isbn != null && bookRepository.existsByIsbn(isbn)) continue;

                Book book = new Book();
                book.setTitle(volumeInfo.optString("title", "Unknown"));
                book.setAuthor(extractAuthors(volumeInfo));
                book.setCategory(extractCategory(volumeInfo));
                book.setDescription(volumeInfo.optString("description", ""));
                book.setThumbnail(extractThumbnail(volumeInfo));
                book.setIsbn(isbn);
                book.setPrice(generatePrice(saleInfo));
                book.setStock((int)(Math.random() * 50) + 10);
                book.setRating(volumeInfo.optDouble("averageRating", 3.5 + Math.random() * 1.5));
                book.setReviews(volumeInfo.optInt("ratingsCount", (int)(Math.random() * 500) + 50));

                bookRepository.save(book);
                saved++;
            } catch (Exception e) {
                System.out.println("Skipping book: " + e.getMessage());
            }
        }
        return saved;
    }

    private String extractIsbn(JSONObject volumeInfo) {
        JSONArray ids = volumeInfo.optJSONArray("industryIdentifiers");
        if (ids == null) return null;
        for (int i = 0; i < ids.length(); i++) {
            if ("ISBN_13".equals(ids.getJSONObject(i).optString("type"))) {
                return ids.getJSONObject(i).optString("identifier");
            }
        }
        return null;
    }

    private String extractAuthors(JSONObject volumeInfo) {
        JSONArray authors = volumeInfo.optJSONArray("authors");
        if (authors == null || authors.isEmpty()) return "Unknown Author";
        return authors.getString(0);
    }

    private String extractCategory(JSONObject volumeInfo) {
        JSONArray cats = volumeInfo.optJSONArray("categories");
        if (cats == null || cats.isEmpty()) return "General";
        return cats.getString(0).split("/")[0].trim();
    }

    private String extractThumbnail(JSONObject volumeInfo) {
        JSONObject imageLinks = volumeInfo.optJSONObject("imageLinks");
        if (imageLinks == null) return "";
        return imageLinks.optString("thumbnail", "").replace("http://", "https://");
    }

    private double generatePrice(JSONObject saleInfo) {
        if (saleInfo != null && saleInfo.has("retailPrice")) {
            double usd = saleInfo.getJSONObject("retailPrice").optDouble("amount", 0);
            if (usd > 0) return Math.round(usd * 25000 / 1000.0) * 1000;
        }
        return (Math.round((Math.random() * 200 + 100)) * 1000);
    }
}