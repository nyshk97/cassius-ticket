class Event < ApplicationRecord
  has_many :ticket_types, -> { order(:position) }, dependent: :destroy, inverse_of: :event
  has_many :orders, dependent: :destroy

  accepts_nested_attributes_for :ticket_types, allow_destroy: true, reject_if: :all_blank

  enum :status, { open: 0, closed: 1 }

  validates :title, presence: true
  validates :player_name, presence: true
  validates :event_date, presence: true
  validates :token, presence: true, uniqueness: true

  before_validation :generate_token, on: :create

  STATUS_LABELS = { "open" => "受付中", "closed" => "締切" }.freeze

  def to_param
    token
  end

  def status_i18n
    STATUS_LABELS[status] || status
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(16)
  end
end
