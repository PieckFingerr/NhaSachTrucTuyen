package com.bookstore.project.repository;

import com.bookstore.project.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {
    boolean existsByIsbn(String isbn);

    List<Book> findByCategory(String category);

    @Query("SELECT b FROM Book b WHERE " +
           "LOWER(b.title) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(b.author) LIKE LOWER(CONCAT('%',:q,'%'))")
    List<Book> search(@Param("q") String q);
}