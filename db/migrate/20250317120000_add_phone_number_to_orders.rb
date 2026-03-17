class AddPhoneNumberToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :phone_number, :string
  end
end
