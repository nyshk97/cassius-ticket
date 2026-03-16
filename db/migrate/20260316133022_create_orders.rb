class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.references :event, null: false, foreign_key: true
      t.string :customer_name, null: false
      t.text :note
      t.integer :payment_status, null: false, default: 0
      t.integer :delivery_status, null: false, default: 0

      t.timestamps
    end
  end
end
