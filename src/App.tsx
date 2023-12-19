import { useEffect, useState } from 'react'
import './App.css'

type Character = {
	id: number
	name: string
	episode: string[]
	image: string
}

const apiUrl = 'https://rickandmortyapi.com/api'

function App() {
	const [data, setData] = useState<Character[]>([])
	const [selected, setSelected] = useState<Character[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string>('')
	const [search, setSearch] = useState<string>('')
	const [showDropdown, setShowDropdown] = useState<boolean>(false)
	const [page, setPage] = useState<number>(1)

	const getItems = (append?: boolean) => {
		setShowDropdown(true)
		setLoading(true)

		fetch(apiUrl + '/character?page=' + page + '&name=' + search)
			.then(res => res.json())
			.then(res => {
				if (res.error) return setError(res.error)

				if (append) setData(s => [...s, ...res.results])
				else {
					setData(res.results)
					const el = document.querySelector('.multiselect-options-table')
					if (el) el.scrollTop = 0
				}

				const nextUrl = res.info.next
				if (!nextUrl) return setPage(-1)
				const url = new URL(res.info.next)
				const params = new URLSearchParams(url.search)
				setPage(Number(params.get('page')) || 1)
			})
			.catch(() => setError('Error'))
			.finally(() => setLoading(false))
	}

	useEffect(() => {
		setError('')
		if (!showDropdown) return setPage(1)
		else getItems()
	}, [search, showDropdown])

	const onSearch = debounce((e: any) => {
		setPage(1)
		setSearch(e.target.value)
	}, 250)

	const onScroll = debounce((e: any) => {
		const { scrollTop, clientHeight, scrollHeight } = e.target
		if (scrollHeight - scrollTop === clientHeight && page !== -1) getItems(true)
	}, 500)

	const onCheckItem = (item: Character) => {
		const checked = selected.some(s => s.id === item.id)
		setSelected(s => (checked ? s.filter(s => s.id !== item.id) : [...s, item]))
	}

	const ItemNameLabel = ({ name }: { name: string }) => {
		return search.length && name.toLowerCase().includes(search.toLowerCase()) ? (
			<span className="multiselect-item-name">
				{name
					.split(new RegExp(`(${search})`, 'gi'))
					.map((word: string, i: number) =>
						word.toLowerCase() === search.toLowerCase() ? (
							<b key={i}>{word}</b>
						) : (
							<span key={i}>{word}</span>
						)
					)}
			</span>
		) : (
			<span className="multiselect-item-name">{name}</span>
		)
	}

	return (
		<div className="App">
			<div className="multiselect-container">
				<div className="multiselect-input-container">
					<div className="multiselect-input-left">
						{selected.map((item, index) => {
							return (
								<span
									key={index}
									className="multiselect-tag"
									tabIndex={1}
									onKeyDown={e => e.key === 'Enter' && onCheckItem(item)}
								>
									{item.name}
									<span
										className="multiselect-tag-close"
										onClick={() => setSelected(s => s.filter((_, i) => i !== index))}
									>
										✕
									</span>
								</span>
							)
						})}
					</div>
					<input
						type="text"
						className="multiselect-input-right"
						onChange={onSearch}
						placeholder="Search"
					/>
					<span className="arrow-icon" onClick={() => setShowDropdown(s => !s)}>
						▼
					</span>
				</div>
				{showDropdown &&
					(error ? (
						<div className="multiselect-error">{error}</div>
					) : (
						<ul className="multiselect-options-table" onScroll={onScroll}>
							{loading && (
								<li className="multiselect-item">
									<div className="multiselect-item-container">Loading...</div>
								</li>
							)}
							{data?.map((item, index) => {
								return (
									<li
										key={index}
										tabIndex={0}
										className="multiselect-item"
										onKeyDown={e => e.key === 'Enter' && onCheckItem(item)}
										onClick={e => {
											e.preventDefault()
											onCheckItem(item)
										}}
									>
										<label htmlFor={item.id.toString()}>
											<div className="multiselect-item-container">
												<input
													type="checkbox"
													className="multiselect-item-checkbox"
													id={item.id.toString()}
													checked={selected.some(s => s.id === item.id)}
													readOnly
												/>
												<img src={item.image} alt={item.image} className="multiselect-item-image" />
												<div className="multiselect-item-name-container">
													<ItemNameLabel name={item.name} />
													<span className="text-muted">{item.episode.length} Episodes</span>
												</div>
											</div>
										</label>
									</li>
								)
							})}
						</ul>
					))}
			</div>
		</div>
	)
}

export default App

const debounce = (callback: Function, wait: number) => {
	let timeoutId: number | undefined
	return (...args: any) => {
		window.clearTimeout(timeoutId)
		timeoutId = window.setTimeout(() => callback.apply(this, args), wait)
	}
}
