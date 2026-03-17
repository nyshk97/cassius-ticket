module Public
  class OrdersController < ApplicationController
    allow_unauthenticated_access
    before_action :set_event
    before_action :ensure_event_open, only: %i[new create]

    layout "public"

    def new
      @order = @event.orders.build
      @event.ticket_types.each do |tt|
        @order.order_items.build(ticket_type: tt)
      end
    end

    def create
      @order = @event.orders.build(order_params)

      if @order.save
        redirect_to public_event_order_path(@event.token, @order)
      else
        @event.ticket_types.each do |tt|
          unless @order.order_items.any? { |oi| oi.ticket_type_id == tt.id }
            @order.order_items.build(ticket_type: tt)
          end
        end
        render :new, status: :unprocessable_entity
      end
    end

    def show
      @order = @event.orders.find(params[:id])
    end

    private

    def set_event
      @event = Event.find_by!(token: params[:public_event_token])
    end

    def ensure_event_open
      unless @event.open?
        redirect_to public_event_order_path(@event.token, 0), alert: "このイベントの注文受付は終了しました。"
      end
    end

    def order_params
      params.require(:order).permit(
        :customer_name, :phone_number, :note,
        order_items_attributes: %i[ticket_type_id quantity]
      )
    end
  end
end
