class CreateEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :events do |t|
      t.string :title, null: false
      t.date :event_date, null: false
      t.string :venue
      t.text :description
      t.integer :status, null: false, default: 0
      t.string :token, null: false

      t.timestamps
    end
    add_index :events, :token, unique: true
  end
end
