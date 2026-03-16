class Event < ApplicationRecord
  has_many :ticket_types, -> { order(:position) }, dependent: :destroy
  has_many :orders, dependent: :destroy

  enum :status, { open: 0, closed: 1 }

  validates :title, presence: true
  validates :event_date, presence: true
  validates :token, presence: true, uniqueness: true

  before_validation :generate_token, on: :create

  def to_param
    token
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(16)
  end
end
