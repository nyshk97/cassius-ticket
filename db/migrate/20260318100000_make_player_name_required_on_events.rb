class MakePlayerNameRequiredOnEvents < ActiveRecord::Migration[8.1]
  def up
    execute "UPDATE events SET player_name = '' WHERE player_name IS NULL"
    change_column_null :events, :player_name, false
  end

  def down
    change_column_null :events, :player_name, true
  end
end
