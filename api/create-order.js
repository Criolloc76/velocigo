import { createClient } from '@supabase/supabase-js'
export default async function handler(req,res){
  if(req.method!=='POST'){res.status(405).json({error:'Method not allowed'});return}
  const url = process.env.SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE
  if(!url||!service){res.status(500).json({error:'Missing Supabase env vars'});return}
  const supabase = createClient(url, service)
  try{
    const { type, restaurant_id, address, details, payment_method, total, items, mandado } = req.body||{}
    if(!type || !address || !payment_method){res.status(400).json({error:'Invalid payload'});return}
    const { data: order, error } = await supabase.from('orders').insert([{
      type, restaurant_id, address, details, payment_method, total, status:'placed'
    }]).select().single()
    if(error) throw error
    const order_id = order.id
    if(type==='comida' && Array.isArray(items) && items.length){
      const rows = items.map(i=>({ order_id, name:i.name, unit_price:i.unit_price, qty:i.qty }))
      const { error: e2 } = await supabase.from('order_items').insert(rows); if(e2) throw e2
    }
    if(type==='mandado' && mandado){
      const { what, from, to } = mandado
      const { error: e3 } = await supabase.from('delivery_tasks').insert([{ order_id, what, from_address: from, to_address: to }])
      if(e3) throw e3
    }
    res.status(200).json({ id: order_id })
  }catch(e){ console.error(e); res.status(500).json({error: e.message||'Internal error'}) }
}
