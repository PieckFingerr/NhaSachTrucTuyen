package com.bookstore.project.controller;

import com.bookstore.project.dto.StockUpdateRequest;
import com.bookstore.project.model.Book;
import com.bookstore.project.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookRepository bookRepository;

    @GetMapping
    public List<Book> getAll() {
        return bookRepository.findAll();
    }

    @GetMapping("/{id}")
    public Book getOne(@PathVariable Long id) {
        return bookRepository.findById(id).orElseThrow();
    }

    /**
     * Giảm stock khi thêm vào giỏ hàng.
     * PATCH /api/books/{id}/stock
     * Body: { "quantity": 1 }  → trừ 1 khỏi stock
     */
    @PatchMapping("/{id}/stock")
    public ResponseEntity<?> updateStock(
            @PathVariable Long id,
            @RequestBody StockUpdateRequest req) {
 
        return bookRepository.findById(id).map(book -> {
            int newStock = book.getStock() - req.getQuantity();
            if (newStock < 0) {
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", "Không đủ hàng trong kho",
                                     "available", book.getStock()));
            }
            book.setStock(newStock);
            bookRepository.save(book);
            return ResponseEntity.ok(Map.of(
                    "id", book.getId(),
                    "stock", book.getStock()
            ));
        }).orElse(ResponseEntity.notFound().build());
    }
 
    /**
     * Khôi phục stock khi huỷ đơn / xoá khỏi giỏ.
     * PATCH /api/books/{id}/stock/restore
     * Body: { "quantity": 1 }
     */
    @PatchMapping("/{id}/stock/restore")
    public ResponseEntity<?> restoreStock(
            @PathVariable Long id,
            @RequestBody StockUpdateRequest req) {
 
        return bookRepository.findById(id).map(book -> {
            book.setStock(book.getStock() + req.getQuantity());
            bookRepository.save(book);
            return ResponseEntity.ok(Map.of(
                    "id", book.getId(),
                    "stock", book.getStock()
            ));
        }).orElse(ResponseEntity.notFound().build());
    }
}