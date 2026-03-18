class EventsController < ApplicationController
  before_action :set_event, only: %i[show edit update destroy toggle_status]

  def index
    @events = Event.order(event_date: :desc)
  end

  def show
    @orders = @event.orders.includes(order_items: :ticket_type).order(created_at: :desc)
  end

  def new
    @event = Event.new
    @event.ticket_types.build
  end

  def create
    @event = Event.new(event_params)
    if @event.save
      redirect_to @event, notice: "イベントを作成しました。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @event.ticket_types.build if @event.ticket_types.empty?
  end

  def update
    if @event.update(event_params)
      redirect_to @event, notice: "イベントを更新しました。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @event.destroy
    redirect_to events_path, notice: "イベントを削除しました。", status: :see_other
  end

  def toggle_status
    @event.open? ? @event.closed! : @event.open!
    redirect_to @event, notice: "ステータスを「#{@event.status_i18n}」に変更しました。"
  end

  private

  def set_event
    @event = Event.find_by!(token: params[:id])
  end

  def event_params
    params.require(:event).permit(
      :title, :player_name, :event_date, :venue, :description, :status,
      ticket_types_attributes: %i[id name price position _destroy]
    )
  end
end
