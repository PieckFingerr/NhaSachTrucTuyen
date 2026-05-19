package com.bookstore.project.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.bookstore.project.service.GoogleBooksService;

@Controller
public class PageController {

    @Autowired
    private GoogleBooksService googleBooksService;

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/catalog")
    public String catalog() {
        return "pages/catalog";
    }

    @GetMapping("/product")
    public String product() {
        return "pages/product";
    }

    @GetMapping("/checkout")
    public String checkout() {
        return "pages/checkout";
    }

    @GetMapping("/order-history")
    public String orderHistory() {
        return "pages/order-history";
    }

    @GetMapping("/auth")
    public String auth() {
        return "pages/auth";
    }

    @GetMapping("/admin/dashboard")
    public String adminDashboard() {
        return "pages/admin/dashboard";
    }

    @GetMapping("/admin/products")
    public String adminProducts() {
        return "pages/admin/products";
    }

    @GetMapping("/admin/orders")
    public String adminOrders() {
        return "pages/admin/orders";
    }

    @GetMapping("/admin/customers")
    public String adminCustomers() {
        return "pages/admin/customers";
    }

    @GetMapping("/admin/categories")
    public String adminCategories() {
        return "pages/admin/categories";
    }

    @GetMapping("/admin/reviews")
    public String adminReviews() {
        return "pages/admin/reviews";
    }

    @GetMapping("/admin/coupons")
    public String adminCoupons() {
        return "pages/admin/coupons";
    }

    @GetMapping("/admin/fetch-books")
    @ResponseBody
    public String fetchBooks(@RequestParam(defaultValue = "bestseller fiction") String q) {
        int count = googleBooksService.fetchAndSave(q);
        return "Saved " + count + " books for query: " + q;
    }

}
