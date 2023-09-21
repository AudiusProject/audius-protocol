create or replace function handle_usdc_purchase() returns trigger as $$
begin

  -- insert seller/artist notification
  INSERT INTO notification
          (slot, user_ids, timestamp, type, specifier, group_id, data)
        VALUES
          (
            new.slot,
            ARRAY [new.seller_user_id],
            new.created_at,
            'usdc_purchase_seller',
            new.buyer_user_id,
            'usdc_purchase_seller:' || 'seller_user_id:' || new.seller_user_id || ':buyer_user_id:' || new.buyer_user_id || ':content_id:' || new.content_id || ':content_type:' || new.content_type,
            json_build_object(
                'content_type', new.content_type,
                'buyer_user_id', new.buyer_user_id,
                'seller_user_id', new.seller_user_id,
                'amount', new.amount,
                'content_id', new.content_id
              )
          ),
          (
            new.slot,
            ARRAY [new.buyer_user_id],
            new.created_at,
            'usdc_purchase_buyer',
            new.buyer_user_id,
            'usdc_purchase_buyer:' || 'seller_user_id:' || new.seller_user_id || ':buyer_user_id:' || new.buyer_user_id || ':content_id:' || new.content_id || ':content_type:' || new.content_type,
            json_build_object(
                'content_type', new.content_type,
                'buyer_user_id', new.buyer_user_id,
                'seller_user_id', new.seller_user_id,
                'amount', new.amount,
                'content_id', new.content_id
            )
          )
        on conflict do nothing;

  return null;
  exception
    when others then
        raise warning 'An error occurred in %: %', tg_name, sqlerrm;
        return null;
end; 
$$ language plpgsql;

do $$ begin
  create trigger on_usdc_purchase
  after insert on usdc_purchases
  for each row execute procedure handle_usdc_purchase();
exception
  when others then null;
end $$;
