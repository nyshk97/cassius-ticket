class Order < ApplicationRecord
  belongs_to :event
  has_many :order_items, dependent: :destroy

  enum :payment_status, { unpaid: 0, paid: 1 }, prefix: true
  enum :delivery_status, { undelivered: 0, delivered: 1 }, prefix: true

  validates :customer_name, presence: true

  def total_amount
    order_items.sum { |item| item.quantity * item.ticket_type.price }
  end
end
