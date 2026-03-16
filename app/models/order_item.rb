class OrderItem < ApplicationRecord
  belongs_to :order
  belongs_to :ticket_type

  validates :quantity, presence: true, numericality: { greater_than: 0 }
end
