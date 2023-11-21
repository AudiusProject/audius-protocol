import { createRef, Component } from 'react'

import { Kind, Status } from '@audius/common'
import AutoComplete from 'antd/lib/auto-complete'
import Input from 'antd/lib/input'
import cn from 'classnames'
import { isEqual } from 'lodash'
import PropTypes from 'prop-types'
import Lottie from 'react-lottie'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { Transition } from 'react-spring/renderprops.cjs'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import IconArrow from 'assets/img/iconArrowGrey.svg'
import IconSearch from 'assets/img/iconSearch.svg'
import SearchBarResult from 'components/search/SearchBarResult'
import { setupHotkeys, removeHotkeys } from 'utils/hotkeyUtil'

import styles from './SearchBar.module.css'

const SEARCH_BAR_OPTION = 'SEARCH_BAR_OPTION'
const ALL_RESULTS_OPTION = 'ALL_RESULTS_OPTION'
const NO_RESULTS_OPTION = 'NO_RESULTS_OPTION'

const messages = {
  searchTagsTitle: (tag) => `Search Tags for ${tag}`,
  searchTagsDisabled: () => 'Search Tags'
}

const maxLength = 500

const TagSearchPopup = ({ tag, style, onClick, disabled, focused }) => (
  <div
    style={style}
    className={styles.tagSearchPopup}
    onClick={() => !disabled && onClick()}
  >
    <div
      className={cn(
        { [styles.enabled]: !disabled },
        { [styles.focused]: focused }
      )}
      tabIndex={-1}
    >
      {messages[disabled ? 'searchTagsDisabled' : 'searchTagsTitle'](tag)}
      {!disabled && <IconArrow className={styles.tagArrow} />}
    </div>
  </div>
)

class SearchBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
      // State variable set to true when an item has been selected.
      selected: false,
      value: '',
      // Indicates whether we are receiving a value prop from the parent
      // that is different than the value state in this class.
      // For example, when the user visits /search/<search_term>, this
      // component receives an initial prop value = <search_term> but we do not
      // want to trigger an animation to the open state
      // (though we do want to collect search results).
      valueFromParent: false,
      // Debounce used to delay search for a small amount of time to avoid
      // too many search calls.
      debounce: null,
      openAnimationTimeout: null,
      hotkeyHook: null,
      shouldDismissTagPopup: false,
      tagPopupFocused: false
    }
    this.autoCompleteRef = createRef()
    this.searchBarRef = createRef()
  }

  componentDidMount() {
    const hook = setupHotkeys({
      191 /* slash */: () => {
        this.autoCompleteRef.current.focus()
      }
    })
    this.setState({ hotkeyHook: hook })
  }

  componentWillUnmount() {
    removeHotkeys(this.state.hotkeyHook)
    this.setState({ hotkeyHook: null })
  }

  onSearch = (value, action) => {
    const trimmedValue = value.slice(0, maxLength)
    this.setState({ value: trimmedValue, valueFromParent: false })

    // Set the search state but don't actually call search
    this.props.onSearch(trimmedValue, false)
    // Set a debounce timer for 100ms to actually send the search
    this.setState({
      debounce: setTimeout(() => {
        this.props.onSearch(trimmedValue, true)
      }, 100)
    })
  }

  onChange = (value) => {
    clearTimeout(this.state.debounce)
  }

  onSelect = (value, option) => {
    if (value === SEARCH_BAR_OPTION || value === ALL_RESULTS_OPTION) {
      // Disallow empty searches.
      if (this.state.value !== '') {
        this.props.onSubmit(this.state.value)
      }
    } else if (value !== NO_RESULTS_OPTION) {
      this.props.goToRoute(value)
      if (this.props.onSelect) this.props.onSelect(value)
    }
    // Lose focus on the bar, timeout the blur so it pops to the end of the event loop.
    setTimeout(() => {
      this.autoCompleteRef.current && this.autoCompleteRef.current.blur()
    }, 0)
    this.setState({ selected: true })
    this.onBlur()
  }

  onFocus = () => {
    this.setState({ shouldDismissTagPopup: false })
    this.searchBarRef.current
      .getElementsByClassName('ant-select-selection-search')[0]
      .classList.add('expanded')
    if (this.state.value !== '') {
      // Delay search results open animation while the search bar expands.
      this.setState({
        openAnimationTimeout: setTimeout(() => {
          this.onSearch(this.state.value)
          this.setState({ open: true, selected: false })
        }, 200)
      })
    }
  }

  onBlur = () => {
    if (document.hasFocus()) {
      this.props.onCancel()
      // Clear the open animation timeout just in case the user suddenly loses focus on the
      // search bar while an animation to open is happening.
      clearTimeout(this.state.openAnimationTimeout)
      if (this.state.open) {
        // Delay search bar collapse while search results close.
        setTimeout(() => {
          this.searchBarRef.current &&
            this.searchBarRef.current
              .getElementsByClassName('ant-select-selection-search')[0]
              .classList.remove('expanded')
        }, 200)
      } else {
        this.searchBarRef.current
          .getElementsByClassName('ant-select-selection-search')[0]
          .classList.remove('expanded')
      }
      this.setState({ open: false })
    }
  }

  onKeyDown = (e) => {
    // Stop up arrow and down arrow from moving the cursor in the text input.
    switch (e.keyCode) {
      case 38 /* up */:
        e.preventDefault()
        this.setState({ tagPopupFocused: false })
        break
      case 40 /* down */:
        e.preventDefault()
        this.setState({ tagPopupFocused: true })
        break
      case 27 /* esc */:
        this.setState({ tagPopupFocused: false })
        this.autoCompleteRef.current.blur()
        this.onBlur()
        break
      case 13 /* enter */:
        this.autoCompleteRef.current.blur()
        this.setState({ tagPopupFocused: false })
        if (this.props.isTagSearch)
          this.setState({ shouldDismissTagPopup: true })
        if (
          (this.props.isTagSearch && this.state.value.length > 1) ||
          (!this.props.isTagSearch && this.state.value.length > 0)
        ) {
          this.props.onSubmit(this.state.value)
          this.setState({ debounce: null })
        }
        break
      default:
    }
  }

  renderTitle(title) {
    return (
      <span className={styles.searchResultHeading}>
        {title}
        <div className={styles.customHr} />
      </span>
    )
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.value !== prevState.value) {
      return { value: nextProps.value, valueFromParent: true }
    } else return null
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Don't rerender right away if there is a new data source because rerendering
    // immediately would throw away the opening animation.
    if (
      !isEqual(nextProps.dataSource, this.props.dataSource) &&
      nextProps.resultsCount > 0
    ) {
      if (!nextState.selected && !nextState.valueFromParent) {
        this.setState({ open: true })
      }
      if (nextProps.status === Status.SUCCESS) {
        return true
      }
      return false
    }
    if (
      this.props.status === Status.LOADING &&
      nextProps.status === Status.SUCCESS &&
      nextProps.resultsCount === 0 &&
      this.state.value !== ''
    ) {
      if (!nextState.selected && !nextState.valueFromParent) {
        this.setState({ open: true })
      }
      return false
    }
    // Close the dropdown if we're searching for '' (deleted text in search).
    if (nextState.value === '' && this.state.value !== nextState.value) {
      this.setState({ open: false })
      return false
    }
    // Make sure that we clear the 'selected' bit so that we can process
    // it again in the next update.
    if (this.state.selected && this.state.valueFromParent) {
      this.setState({ selected: false })
    }
    return true
  }

  render() {
    const { status, searchText, dataSource, resultsCount, isTagSearch } =
      this.props
    const searchResults = dataSource.sections
      .filter((group) => {
        if (group.children.length < 1) {
          return false
        }
        const vals = group.children
          .slice(0, Math.min(3, group.children.length))
          .filter((opt) => {
            return opt.key || opt.primary
          })
        if (vals < 1) {
          return false
        }
        return true
      })
      .map((group) => ({
        label: this.renderTitle(group.title),
        options: group.children
          .slice(0, Math.min(3, group.children.length))
          .map((opt) => ({
            label: (
              <div className={styles.option} key={opt.key || opt.primary}>
                <SearchBarResult
                  kind={
                    group.title === 'Profiles'
                      ? Kind.USERS
                      : group.title === 'Tracks'
                      ? Kind.TRACKS
                      : Kind.COLLECTIONS
                  }
                  id={String(opt.id)}
                  userId={opt.userId}
                  sizes={opt.sizes}
                  imageMultihash={opt.imageMultihash}
                  size={opt.size}
                  primary={opt.primary}
                  defaultImage={opt.defaultImage}
                  secondary={opt.secondary}
                  isVerifiedUser={opt.isVerifiedUser}
                  tier={opt.tier}
                />
              </div>
            ),
            value: (opt.key || opt.primary).toString()
          }))
      }))

    let options = []
    if (resultsCount > 0) {
      const allResultsOption = {
        label: (
          <div key={ALL_RESULTS_OPTION} className={styles.allResultsOption}>
            <div className={styles.allResultsOptionWrapper}>
              <div>
                <span>View More Results</span>
                <IconArrow
                  height={'7px'}
                  width={'7px'}
                  className={styles.iconArrow}
                />
              </div>
            </div>
          </div>
        ),
        value: ALL_RESULTS_OPTION
      }
      options = searchResults.concat(allResultsOption)
    } else {
      if (status !== Status.LOADING && searchText !== '') {
        // Need to ensure searchText !== '' in this case,
        // because we clear the search if we lose focus,
        // causing status to be set to SUCCESS,
        // but we don't want to show the no results box.

        const noResultOption = {
          label: (
            <div key={NO_RESULTS_OPTION} className={styles.noResultsOption}>
              <div className={styles.noResults}>
                <span>No Results</span>
              </div>
            </div>
          ),
          value: NO_RESULTS_OPTION
        }

        options = [noResultOption]
      }
    }

    // If we're searching for a tag,
    // don't open the autocomplete popup, and instead show our
    // own custom component below.
    const showAutocomplete = !isTagSearch && this.state.open
    const showTagPopup =
      isTagSearch && this.state.open && !this.state.shouldDismissTagPopup
    return (
      <div
        className={styles.searchBar}
        id='search-bar-autocomplete'
        ref={this.searchBarRef}
      >
        {/* show search spinner if not a tag search and there is some value present */}
        {!isTagSearch && this.state.value && (
          <div
            className={cn(styles.loadingAnimation, {
              [styles.show]: status === Status.LOADING && this.state.open
            })}
          >
            <Lottie
              options={{
                loop: true,
                autoplay: true,
                animationData: loadingSpinner
              }}
            />
          </div>
        )}
        <AutoComplete
          ref={this.autoCompleteRef}
          dropdownClassName={cn(styles.searchBox, {
            [styles.hasResults]: searchResults.length
          })}
          dropdownMatchSelectWidth={false}
          options={options}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          onSelect={this.onSelect}
          onSearch={this.onSearch}
          onChange={this.onChange}
          open={showAutocomplete}
          value={this.state.value}
          // Mount the dropdown inside the searchbar div (otherwise it just gets dumped at root).
          getPopupContainer={(trigger) => trigger.parentNode}
        >
          <Input
            placeholder='Search'
            name='search'
            autoComplete='off'
            type='search'
            prefix={<IconSearch />}
            onKeyDown={this.onKeyDown}
            spellCheck={false}
          />
        </AutoComplete>
        <Transition
          items={showTagPopup}
          from={{ opacity: 0, transform: 'translate(0px, -16px)' }}
          enter={{ opacity: 1, transform: 'translate(0px, 0px)' }}
          leave={{ opacity: 0, transform: 'translate(0px, -16px)' }}
          config={{
            tension: 310,
            friction: 26
          }}
        >
          {(item) =>
            item &&
            ((props) => (
              <TagSearchPopup
                style={props}
                tag={this.state.value}
                onClick={() => {
                  this.props.onSubmit(this.state.value)
                }}
                disabled={this.state.value.length < 2} // Don't allow clicks until we've typed our first letter past '#'
                focused={this.state.tagPopupFocused}
              />
            ))
          }
        </Transition>
      </div>
    )
  }
}

SearchBar.propTypes = {
  dataSource: PropTypes.object,
  resultsCount: PropTypes.number,
  onSearch: PropTypes.func,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  goToRoute: PropTypes.func
}

SearchBar.defaultProps = {
  dataSource: [],
  resultsCount: 0
}

export default SearchBar
