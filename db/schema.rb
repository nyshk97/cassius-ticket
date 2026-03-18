# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_18_100000) do
  create_table "events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.date "event_date", null: false
    t.string "player_name", null: false
    t.integer "status", default: 0, null: false
    t.string "title", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.string "venue"
    t.index ["token"], name: "index_events_on_token", unique: true
  end

  create_table "order_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "order_id", null: false
    t.integer "quantity", null: false
    t.integer "ticket_type_id", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_order_items_on_order_id"
    t.index ["ticket_type_id"], name: "index_order_items_on_ticket_type_id"
  end

  create_table "orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "customer_name", null: false
    t.integer "delivery_status", default: 0, null: false
    t.integer "event_id", null: false
    t.text "note"
    t.integer "payment_status", default: 0, null: false
    t.string "phone_number"
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_orders_on_event_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "ticket_types", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "event_id", null: false
    t.string "name", null: false
    t.integer "position", default: 0, null: false
    t.integer "price", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_ticket_types_on_event_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email_address", null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  add_foreign_key "order_items", "orders"
  add_foreign_key "order_items", "ticket_types"
  add_foreign_key "orders", "events"
  add_foreign_key "sessions", "users"
  add_foreign_key "ticket_types", "events"
end
