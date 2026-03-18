class AddPlayerNameToEvents < ActiveRecord::Migration[8.1]
  def change
    add_column :events, :player_name, :string
  end
end
