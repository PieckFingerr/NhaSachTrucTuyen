package com.bookstore.project.controller;

import com.bookstore.project.dto.BookRequest;
import com.bookstore.project.dto.StockUpdateRequest;
import com.bookstore.project.model.Book;
import com.bookstore.project.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookRepository bookRepository;

    // ── GET ALL ──────────────────────────────────────────────
    @GetMapping
    public List<Book> getAll() {
        return bookRepository.findAll();
    }

    // ── GET ONE ──────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Book> getOne(@PathVariable Long id) {
        return bookRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── CREATE ───────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> create(@RequestBody BookRequest req) {
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));
        }
        if (req.getIsbn() != null && bookRepository.existsByIsbn(req.getIsbn())) {
            return ResponseEntity.badRequest().body(Map.of("error", "ISBN already exists"));
        }

        Book book = new Book();
        mapRequestToBook(req, book);
        Book saved = bookRepository.save(book);
        return ResponseEntity.ok(saved);
    }

    // ── UPDATE ───────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody BookRequest req) {
        return bookRepository.findById(id).map(book -> {
            mapRequestToBook(req, book);
            bookRepository.save(book);
            return ResponseEntity.ok(book);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── DELETE ───────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!bookRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        bookRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Book deleted successfully"));
    }

    // ── SEARCH ──────────────────────────────────────────────
    @GetMapping("/search")
    public List<Book> search(@RequestParam String q) {
        return bookRepository.search(q);
    }

    // ── GET BY CATEGORY ──────────────────────────────────────
    @GetMapping("/category/{category}")
    public List<Book> getByCategory(@PathVariable String category) {
        return bookRepository.findByCategory(category);
    }

    // ── PATCH STOCK (giảm khi thêm vào giỏ) ─────────────────
    @PatchMapping("/{id}/stock")
    public ResponseEntity<?> updateStock(@PathVariable Long id,
                                         @RequestBody StockUpdateRequest req) {
        return bookRepository.findById(id).map(book -> {
            int newStock = book.getStock() - req.getQuantity();
            if (newStock < 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Không đủ hàng trong kho",
                                     "available", book.getStock()));
            }
            book.setStock(newStock);
            bookRepository.save(book);
            return ResponseEntity.ok(Map.of("id", book.getId(), "stock", book.getStock()));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── PATCH STOCK RESTORE (hoàn khi xoá khỏi giỏ) ─────────
    @PatchMapping("/{id}/stock/restore")
    public ResponseEntity<?> restoreStock(@PathVariable Long id,
                                          @RequestBody StockUpdateRequest req) {
        return bookRepository.findById(id).map(book -> {
            book.setStock(book.getStock() + req.getQuantity());
            bookRepository.save(book);
            return ResponseEntity.ok(Map.of("id", book.getId(), "stock", book.getStock()));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Helper: map DTO → Entity ──────────────────────────────
    private void mapRequestToBook(BookRequest req, Book book) {
        book.setTitle(req.getTitle());
        book.setAuthor(req.getAuthor());
        book.setCategory(req.getCategory());
        book.setDescription(req.getDescription());
        book.setThumbnail(req.getThumbnail());
        book.setIsbn(req.getIsbn());
        book.setPrice(req.getPrice());
        book.setStock(req.getStock());
        book.setRating(req.getRating() > 0 ? req.getRating() : 4.0);
        book.setReviews(req.getReviews());
    }
}