class Order < ApplicationRecord
  belongs_to :event
  has_many :order_items, dependent: :destroy

  accepts_nested_attributes_for :order_items, reject_if: proc { |attrs| attrs["quantity"].blank? || attrs["quantity"].to_i <= 0 }

  enum :payment_status, { unpaid: 0, paid: 1 }, prefix: true
  enum :delivery_status, { undelivered: 0, delivered: 1 }, prefix: true

  validates :customer_name, presence: true
  validate :must_have_at_least_one_item

  def total_amount
    order_items.sum { |item| item.quantity * item.ticket_type.price }
  end

  private

  def must_have_at_least_one_item
    if order_items.reject(&:marked_for_destruction?).empty?
      errors.add(:base, "チケットを1枚以上選択してください")
    end
  end
end
