package com.bookstore.project.dto;

public class StockUpdateRequest {
    private int quantity; // số lượng cần trừ (dương = trừ, âm = cộng)

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}