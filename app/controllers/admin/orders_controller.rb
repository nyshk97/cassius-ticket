module Admin
  class OrdersController < ApplicationController
    before_action :set_event
    before_action :set_order, only: %i[show destroy toggle_payment toggle_delivery]

    def show
    end

    def destroy
      @order.destroy
      redirect_to event_path(@event), notice: "注文を削除しました。", status: :see_other
    end

    def toggle_payment
      @order.payment_status_unpaid? ? @order.payment_status_paid! : @order.payment_status_unpaid!
      redirect_to event_path(@event), notice: "#{@order.customer_name}の支払い状況を「#{@order.payment_status_i18n}」に変更しました。"
    end

    def toggle_delivery
      @order.delivery_status_undelivered? ? @order.delivery_status_delivered! : @order.delivery_status_undelivered!
      redirect_to event_path(@event), notice: "#{@order.customer_name}の受渡状況を「#{@order.delivery_status_i18n}」に変更しました。"
    end

    private

    def set_event
      @event = Event.find_by!(token: params[:event_id])
    end

    def set_order
      @order = @event.orders.find(params[:id])
    end
  end
end
