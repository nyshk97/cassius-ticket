module Admin
  class OrdersController < ApplicationController
    before_action :set_event
    before_action :set_order, only: %i[destroy toggle_payment toggle_delivery]

    def destroy
      @order.destroy
      redirect_to event_path(@event), notice: "注文を削除しました。", status: :see_other
    end

    def toggle_payment
      new_status = @order.payment_status_unpaid? ? :paid : :unpaid
      @order.update_column(:payment_status, Order.payment_statuses[new_status])
      redirect_to event_path(@event), notice: "#{@order.customer_name}の支払い状況を「#{@order.reload.payment_status_i18n}」に変更しました。"
    end

    def toggle_delivery
      new_status = @order.delivery_status_undelivered? ? :delivered : :undelivered
      @order.update_column(:delivery_status, Order.delivery_statuses[new_status])
      redirect_to event_path(@event), notice: "#{@order.customer_name}の受渡状況を「#{@order.reload.delivery_status_i18n}」に変更しました。"
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
